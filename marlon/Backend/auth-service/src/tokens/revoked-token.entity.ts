import {Entity, PrimaryColumn, Column, CreateDateColumn, } from 'typeorm';

@Entity('revoked_tokens')
export class RevokedToken {
    @PrimaryColumn()
    jti: string; // ID del JWT

    @Column()
    userId: string;

    @Column()
    expiresAt: Date;

    @CreateDateColumn()
    revokedAt: Date;
}
