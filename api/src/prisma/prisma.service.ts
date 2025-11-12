import { INestApplication, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
<<<<<<< HEAD
=======
  constructor(options?: Prisma.PrismaClientOptions) {
    super(options);
  }

>>>>>>> pr-22
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async enableShutdownHooks(app: INestApplication) {
<<<<<<< HEAD
    (this as any).$on('beforeExit', async () => {
=======
    this.$on('beforeExit', async () => {
>>>>>>> pr-22
      await app.close();
    });
  }
}
