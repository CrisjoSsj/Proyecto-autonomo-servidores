import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn  } from 'typeorm';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column({ unique: true})
    username: string;

    @Column()
    passwordHash: string;

    @Column({ default: 'user' })
    role: string;

    @CreateDateColumn()
    createdAt: Date;
}