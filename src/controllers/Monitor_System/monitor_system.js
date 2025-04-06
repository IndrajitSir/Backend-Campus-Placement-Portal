import os from "os";
import { asyncHandler } from "../../utils/asyncHandler";

const systemStatus = asyncHandler((req, res) => {
    const uptime = os.uptime();
    const freeMem = os.freemem();
    const totalMem = os.totalmem();
    const cpuLoad = os.loadavg();

    res.json({ uptime, memory: { free: freeMem, total: totalMem }, cpuLoad });
});

export { systemStatus }
