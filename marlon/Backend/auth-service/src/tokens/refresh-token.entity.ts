import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, } from 'typeorm';

@Entity('refresh_tokens')
export class RefreshToken {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @Column()
    tokenHash: string;

    @Column()
    expiresAt: Date;

    @Column({ nullable: true })
    revokedAt: Date;

    @CreateDateColumn()
    createdAt: Date;
}
