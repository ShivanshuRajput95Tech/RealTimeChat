import jwt from "jsonwebtoken";

// function to generate JWT token
export const generateToken = (userId) => {
    const token = jwt.sign({ userId },
        process.env.JWT_SECRET, { expiresIn: "7d" }
    );

    return token;
};