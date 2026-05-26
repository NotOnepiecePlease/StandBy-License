using StandBy.License.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        var allowedOrigins = builder.Configuration["Cors:AllowedOrigins"];
        if (!string.IsNullOrWhiteSpace(allowedOrigins))
            policy.WithOrigins(allowedOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries))
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        else
            policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});

var supabaseUrl = (builder.Configuration["Supabase:Url"]
    ?? throw new InvalidOperationException("Supabase:Url não configurado.")).Trim();
var supabaseKey = (builder.Configuration["Supabase:ServiceRoleKey"]
    ?? throw new InvalidOperationException("Supabase:ServiceRoleKey não configurado."))
    .Replace("\n", "").Replace("\r", "").Trim();

builder.Services.AddHttpClient<LicencaService>(client =>
{
    client.BaseAddress = new Uri($"{supabaseUrl.TrimEnd('/')}/rest/v1/");
    client.DefaultRequestHeaders.Add("apikey", supabaseKey);
    client.DefaultRequestHeaders.Add("Authorization", $"Bearer {supabaseKey}");
    client.DefaultRequestHeaders.Add("Prefer", "return=representation");
});

var app = builder.Build();

app.UseHttpsRedirection();
app.UseCors();
app.MapControllers();

app.Run();
