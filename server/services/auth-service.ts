import bcrypt from "bcrypt";
import { type User, type InsertUser } from "@shared/schema";
import { type IStorage } from "../storage";

const SALT_ROUNDS = 10;

export class AuthService {
  constructor(private storage: IStorage) {}

  async register(name: string, email: string, password: string): Promise<User> {
    // Check if user already exists
    const existingUser = await this.storage.getUserByEmail(email);
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create the user
    const userData: InsertUser = {
      name,
      email,
      passwordHash,
    };

    return this.storage.createUser(userData);
  }

  async login(email: string, password: string): Promise<User> {
    // Find user by email
    const user = await this.storage.getUserByEmail(email);
    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new Error("Invalid email or password");
    }

    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.storage.getUserById(id);
  }
}
