import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService implements OnModuleInit {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) {}

    async onModuleInit() {
        await this.seedAdmin();
    }

    private async seedAdmin() {
        const adminExists = await this.userRepository.findOne({
            where: { username: 'admin' }
        });

        if (!adminExists) {
            const passwordHash = await bcrypt.hash('Admin123!', 10);
            
            const admin = this.userRepository.create({
                email: 'admin@findyourwork.com',
                firstName: 'Admin',
                lastName: 'System',
                username: 'admin',
                passwordHash,
                role: 'admin',
            });

            await this.userRepository.save(admin);
            console.log('✅ Usuario admin creado automáticamente');
            console.log('   Username: admin');
            console.log('   Password: Admin123!');
        }
    }
}
