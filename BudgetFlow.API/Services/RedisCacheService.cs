using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace BudgetFlow.API.Services;

public class RedisCacheService : ICacheService
{
    private readonly IDistributedCache _cache;
    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<RedisCacheService> _logger;
    private static readonly JsonSerializerOptions _json = new() { PropertyNameCaseInsensitive = true };

    public RedisCacheService(IDistributedCache cache, IConnectionMultiplexer redis, ILogger<RedisCacheService> logger)
    {
        _cache = cache;
        _redis = redis;
        _logger = logger;
    }

    public async Task<T?> GetAsync<T>(string key)
    {
        try
        {
            var data = await _cache.GetStringAsync(key);
            return data is null ? default : JsonSerializer.Deserialize<T>(data, _json);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[Cache] GetAsync failed for key={Key}, falling through to DB", key);
            return default;
        }
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiry = null)
    {
        try
        {
            var options = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = expiry ?? TimeSpan.FromMinutes(5)
            };
            await _cache.SetStringAsync(key, JsonSerializer.Serialize(value, _json), options);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[Cache] SetAsync failed for key={Key}", key);
        }
    }

    public async Task RemoveAsync(string key)
    {
        try { await _cache.RemoveAsync(key); }
        catch (Exception ex) { _logger.LogWarning(ex, "[Cache] RemoveAsync failed for key={Key}", key); }
    }

    public async Task RemoveByPatternAsync(string pattern)
    {
        try
        {
            if (!_redis.IsConnected) return;
            var db = _redis.GetDatabase();
            var server = _redis.GetServer(_redis.GetEndPoints().First());
            var keys = server.Keys(pattern: $"*{pattern}*").ToArray();
            if (keys.Length > 0)
                await db.KeyDeleteAsync(keys);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[Cache] RemoveByPatternAsync failed for pattern={Pattern}", pattern);
        }
    }
}
