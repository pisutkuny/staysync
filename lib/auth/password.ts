import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Hash a plain text password
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hashed password
 */
export async function verifyPassword(
    password: string,
    hashedPassword: string
): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
}

/**
 * Validate password strength
 * Current rules: minimum 8 characters
 */
export function validatePassword(password: string): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }

    // Future: Add more rules
    // - Require uppercase
    // - Require lowercase
    // - Require numbers
    // - Require special characters

    return {
        valid: errors.length === 0,
        errors,
    };
}
