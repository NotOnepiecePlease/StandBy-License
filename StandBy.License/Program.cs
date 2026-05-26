using StandBy.License.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

var supabaseUrl = builder.Configuration["Supabase:Url"]
    ?? throw new InvalidOperationException("Supabase:Url não configurado.");
var supabaseKey = builder.Configuration["Supabase:ServiceRoleKey"]
    ?? throw new InvalidOperationException("Supabase:ServiceRoleKey não configurado.");

builder.Services.AddHttpClient<LicencaService>(client =>
{
    client.BaseAddress = new Uri($"{supabaseUrl.TrimEnd('/')}/rest/v1/");
    client.DefaultRequestHeaders.Add("apikey", supabaseKey);
    client.DefaultRequestHeaders.Add("Authorization", $"Bearer {supabaseKey}");
    client.DefaultRequestHeaders.Add("Prefer", "return=representation");
});

var app = builder.Build();

app.UseHttpsRedirection();
app.MapControllers();

app.Run();
