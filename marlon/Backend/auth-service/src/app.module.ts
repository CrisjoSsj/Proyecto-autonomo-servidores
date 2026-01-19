import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/user.entity';
import { RefreshToken } from './tokens/refresh-token.entity';
import { RevokedToken } from './tokens/revoked-token.entity'; 
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersController } from './users/users.controller';
import { SeedService } from './shared/seed.service';


@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'auth.db',
      entities: [User, RefreshToken, RevokedToken],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([User, RefreshToken, RevokedToken]),
    AuthModule,
  ],
  controllers: [AppController, UsersController],
  providers: [AppService, SeedService],
})
export class AppModule {}
