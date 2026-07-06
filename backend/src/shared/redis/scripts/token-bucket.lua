-- Atomic token-bucket rate limiter.
--
-- KEYS[1] = bucket key
-- ARGV[1] = capacity (max tokens)
-- ARGV[2] = refill rate, tokens per second
-- ARGV[3] = cost of this request, in tokens
-- ARGV[4] = current time in milliseconds
--
-- Returns { allowed (0/1), tokens_remaining }
--
-- Runs as a single EVAL so the read-modify-write of the bucket's state is
-- atomic even under concurrent requests for the same key — there is no
-- window between "check" and "decrement" for two requests to both observe
-- the last token as available.

local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local cost = tonumber(ARGV[3])
local now = tonumber(ARGV[4])

local bucket = redis.call('HMGET', key, 'tokens', 'ts')
local tokens = tonumber(bucket[1])
local last_refill = tonumber(bucket[2])

if tokens == nil then
  tokens = capacity
  last_refill = now
end

local elapsed_seconds = math.max(0, now - last_refill) / 1000
tokens = math.min(capacity, tokens + elapsed_seconds * refill_rate)

local allowed = 0
if tokens >= cost then
  tokens = tokens - cost
  allowed = 1
end

redis.call('HMSET', key, 'tokens', tostring(tokens), 'ts', tostring(now))

-- Bucket is inert once it's had time to fully refill with nobody touching it.
local ttl_seconds = math.ceil(capacity / refill_rate) + 60
redis.call('EXPIRE', key, ttl_seconds)

return { allowed, tokens }
