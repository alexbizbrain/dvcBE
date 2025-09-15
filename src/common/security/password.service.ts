import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class PasswordService {
  async hash(plain: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(plain, salt);
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
