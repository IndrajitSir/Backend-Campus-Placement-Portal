const uri = "http://localhost:6005/auth/google/callback"
export const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    path: "/",
}
export const activeRooms = new Set();
export const timers = {};
export const userSocketMap = new Map();