const uri = "http://localhost:6005/auth/google/callback"
export const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    path: "/",
}
export const activeRooms = new Set();
export const timers = {};