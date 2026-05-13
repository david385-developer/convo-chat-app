const rateLimit = new Map();

const rateLimiter = (limit = 100, windowMs = 15 * 60 * 1000) => {
    return (req, res, next) => {
        const ip = req.ip;
        const now = Date.now();
        
        if (!rateLimit.has(ip)) {
            rateLimit.set(ip, { count: 1, resetTime: now + windowMs });
            return next();
        }

        const data = rateLimit.get(ip);

        if (now > data.resetTime) {
            data.count = 1;
            data.resetTime = now + windowMs;
            return next();
        }

        data.count++;
        if (data.count > limit) {
            return res.status(429).json({
                success: false,
                message: 'Too many requests, please try again later.'
            });
        }

        next();
    };
};

module.exports = rateLimiter;
