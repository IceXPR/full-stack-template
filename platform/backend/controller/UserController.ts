import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { User } from "../entity/User";

const userRepository = AppDataSource.getRepository(User);

export class UserController {
    // Get all users
    static async getAllUsers(_req: Request, res: Response) {
        try {
            const users = await userRepository.find();
            return res.json(users);
        } catch (error) {
            return res.status(500).json({ error: "Error fetching users" });
        }
    }

    // Get user by ID
    static async getUserById(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const user = await userRepository.findOneBy({ id });
            
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }
            
            return res.json(user);
        } catch (error) {
            return res.status(500).json({ error: "Error fetching user" });
        }
    }

    // Create new user
    static async createUser(req: Request, res: Response) {
        try {
            const { firstName, lastName, email } = req.body;
            
            const user = userRepository.create({
                firstName,
                lastName,
                email
            });
            
            await userRepository.save(user);
            return res.status(201).json(user);
        } catch (error) {
            return res.status(500).json({ error: "Error creating user" });
        }
    }

    // Update user
    static async updateUser(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const user = await userRepository.findOneBy({ id });
            
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }
            
            userRepository.merge(user, req.body);
            const results = await userRepository.save(user);
            return res.json(results);
        } catch (error) {
            return res.status(500).json({ error: "Error updating user" });
        }
    }

    // Delete user
    static async deleteUser(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const user = await userRepository.findOneBy({ id });
            
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }
            
            await userRepository.remove(user);
            return res.status(204).send();
        } catch (error) {
            return res.status(500).json({ error: "Error deleting user" });
        }
    }
} 