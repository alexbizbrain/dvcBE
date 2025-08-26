import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
}

export interface DatabaseHealthStatus {
  status: 'healthy' | 'unhealthy';
  connected: boolean;
  responseTime?: number;
  version?: string;
  error?: string;
}

export interface DetailedHealthStatus {
  application: HealthStatus;
  database: DatabaseHealthStatus;
  services: {
    prisma: {
      status: 'healthy' | 'unhealthy';
      connected: boolean;
    };
  };
  statistics: {
    totalUsers: number;
    totalRoles: number;
    activeUsers: number;
    usersByRole: { roleName: string; count: number }[];
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getApplicationHealth(): Promise<HealthStatus> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  async getDatabaseHealth(): Promise<{ database: DatabaseHealthStatus }> {
    const startTime = Date.now();
    
    try {
      // Test basic connectivity
      const isHealthy = await this.prisma.healthCheck();
      const responseTime = Date.now() - startTime;
      
      if (!isHealthy) {
        return {
          database: {
            status: 'unhealthy',
            connected: false,
            responseTime,
            error: 'Database health check failed',
          },
        };
      }

      // Get database info
      const dbInfo = await this.prisma.getDatabaseInfo();
      
      return {
        database: {
          status: 'healthy',
          connected: true,
          responseTime,
          version: dbInfo.version,
        },
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.logger.error('Database health check failed:', error);
      
      return {
        database: {
          status: 'unhealthy',
          connected: false,
          responseTime,
          error: error.message,
        },
      };
    }
  }

  async getDetailedHealth(): Promise<DetailedHealthStatus> {
    const applicationHealth = await this.getApplicationHealth();
    const { database: databaseHealth } = await this.getDatabaseHealth();
    
    // Get service-specific health
    const prismaConnected = await this.checkPrismaConnection();
    
    // Get database statistics
    const statistics = await this.getDatabaseStatistics();

    return {
      application: applicationHealth,
      database: databaseHealth,
      services: {
        prisma: {
          status: prismaConnected ? 'healthy' : 'unhealthy',
          connected: prismaConnected,
        },
      },
      statistics,
    };
  }

  private async checkPrismaConnection(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('Prisma connection check failed:', error);
      return false;
    }
  }

  private async getDatabaseStatistics(): Promise<DetailedHealthStatus['statistics']> {
    try {
      const [totalUsers, totalRoles, activeUsers, usersByRole] = await Promise.all([
        this.getTotalUsers(),
        this.getTotalRoles(),
        this.getActiveUsers(),
        this.getUsersByRole(),
      ]);

      return {
        totalUsers,
        totalRoles,
        activeUsers,
        usersByRole,
      };
    } catch (error) {
      this.logger.error('Failed to get database statistics:', error);
      return {
        totalUsers: -1,
        totalRoles: -1,
        activeUsers: -1,
        usersByRole: [],
      };
    }
  }

  private async getTotalUsers(): Promise<number> {
    return this.prisma.user.count();
  }

  private async getTotalRoles(): Promise<number> {
    return this.prisma.role.count();
  }

  private async getActiveUsers(): Promise<number> {
    return this.prisma.user.count({
      where: { isActive: true },
    });
  }

  private async getUsersByRole(): Promise<{ roleName: string; count: number }[]> {
    const result = await this.prisma.role.findMany({
      include: {
        _count: {
          select: {
            users: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    return result.map(role => ({
      roleName: role.name,
      count: role._count.users,
    }));
  }

  async getConnectionPoolInfo(): Promise<any> {
    try {
      // Get connection pool metrics if available
      const result = await this.prisma.$queryRaw`
        SELECT 
          datname as database_name,
          numbackends as active_connections,
          xact_commit as transactions_committed,
          xact_rollback as transactions_rolled_back,
          blks_read as blocks_read,
          blks_hit as blocks_hit,
          tup_returned as tuples_returned,
          tup_fetched as tuples_fetched,
          tup_inserted as tuples_inserted,
          tup_updated as tuples_updated,
          tup_deleted as tuples_deleted
        FROM pg_stat_database 
        WHERE datname = current_database()
      `;
      
      return result;
    } catch (error) {
      this.logger.error('Failed to get connection pool info:', error);
      return null;
    }
  }

  async getDatabaseSize(): Promise<string | null> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      ` as any[];
      
      return result[0]?.size || null;
    } catch (error) {
      this.logger.error('Failed to get database size:', error);
      return null;
    }
  }

  async getTableSizes(): Promise<any[]> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
          pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      `;
      
      return result as any[];
    } catch (error) {
      this.logger.error('Failed to get table sizes:', error);
      return [];
    }
  }
}