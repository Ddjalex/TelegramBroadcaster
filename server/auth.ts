import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { storage } from "./storage";

declare module "express-session" {
  interface SessionData {
    adminId?: number;
    username?: string;
  }
}

export async function initializeDefaultAdmin() {
  try {
    const existingAdmin = await storage.getAdminByUsername("admin");
    
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash("admin123", 10);
      await storage.createAdmin({
        username: "admin",
        passwordHash,
      });
      console.log("Default admin user created: admin/admin123");
    }
  } catch (error) {
    console.error("Error initializing default admin:", error);
  }
}

export async function loginAdmin(username: string, password: string): Promise<{ success: boolean; admin?: any; error?: string }> {
  try {
    const admin = await storage.getAdminByUsername(username);
    
    if (!admin) {
      return { success: false, error: "Invalid username or password" };
    }

    const isValidPassword = await bcrypt.compare(password, admin.passwordHash);
    
    if (!isValidPassword) {
      return { success: false, error: "Invalid username or password" };
    }

    return { 
      success: true, 
      admin: { 
        id: admin.id, 
        username: admin.username 
      } 
    };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "Internal server error" };
  }
}

export async function changeAdminPassword(username: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await storage.getAdminByUsername(username);
    
    if (!admin) {
      return { success: false, error: "Admin not found" };
    }

    const isValidCurrentPassword = await bcrypt.compare(currentPassword, admin.passwordHash);
    
    if (!isValidCurrentPassword) {
      return { success: false, error: "Current password is incorrect" };
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await storage.updateAdminPassword(username, newPasswordHash);

    return { success: true };
  } catch (error) {
    console.error("Password change error:", error);
    return { success: false, error: "Internal server error" };
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.adminId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

export function checkAuth(req: Request, res: Response, next: NextFunction) {
  // This middleware just passes through but makes auth status available
  next();
}