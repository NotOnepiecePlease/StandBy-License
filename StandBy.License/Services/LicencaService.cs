using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using StandBy.License.DTOs;
using StandBy.License.Models;

namespace StandBy.License.Services;

public class LicencaService(HttpClient http)
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public async Task<ValidateResponse> ValidarAsync(string chave, string machineId)
    {
        var licenca = await BuscarPorChaveAsync(chave);

        if (licenca is null)
            return new ValidateResponse(false, null, null, "Licença não encontrada.");

        if (!licenca.Ativo)
            return new ValidateResponse(false, licenca.ClienteNome, licenca.ExpiraEm, "Licença desativada.");

        if (licenca.ExpiraEm < DateTime.UtcNow)
            return new ValidateResponse(false, licenca.ClienteNome, licenca.ExpiraEm, "Licença expirada.");

        if (string.IsNullOrEmpty(licenca.MachineId))
        {
            await AtualizarAsync(licenca.Id, new { machine_id = machineId });
        }
        else if (licenca.MachineId != machineId)
        {
            return new ValidateResponse(false, licenca.ClienteNome, licenca.ExpiraEm, "Licença vinculada a outra máquina.");
        }

        return new ValidateResponse(true, licenca.ClienteNome, licenca.ExpiraEm, null);
    }

    public async Task<List<LicencaResponse>> ListarAsync()
    {
        var res = await http.GetAsync("licencas?order=criado_em.desc");
        res.EnsureSuccessStatusCode();
        var lista = await res.Content.ReadFromJsonAsync<List<Licenca>>(JsonOpts) ?? [];
        return lista.Select(MapResponse).ToList();
    }

    public async Task<LicencaResponse> CriarAsync(CriarLicencaRequest req)
    {
        var payload = new
        {
            chave = GerarChave(),
            cliente_nome = req.ClienteNome,
            expira_em = DateTime.UtcNow.AddMonths(req.DuracaoMeses),
            ativo = true,
            criado_em = DateTime.UtcNow
        };

        var res = await http.PostAsJsonAsync("licencas?select=*", payload, JsonOpts);
        res.EnsureSuccessStatusCode();
        var lista = await res.Content.ReadFromJsonAsync<List<Licenca>>(JsonOpts) ?? [];
        return MapResponse(lista.First());
    }

    public async Task<LicencaResponse?> RenovarAsync(string id, RenovarLicencaRequest req)
    {
        var licenca = await BuscarPorIdAsync(id);
        if (licenca is null) return null;

        var novaExpiracao = licenca.ExpiraEm < DateTime.UtcNow
            ? DateTime.UtcNow.AddMonths(req.DuracaoMeses)
            : licenca.ExpiraEm.AddMonths(req.DuracaoMeses);

        await AtualizarAsync(id, new { expira_em = novaExpiracao, ativo = true });
        licenca.ExpiraEm = novaExpiracao;
        licenca.Ativo = true;
        return MapResponse(licenca);
    }

    public async Task<LicencaResponse?> RevogarAsync(string id)
    {
        var licenca = await BuscarPorIdAsync(id);
        if (licenca is null) return null;
        await AtualizarAsync(id, new { ativo = false });
        licenca.Ativo = false;
        return MapResponse(licenca);
    }

    public async Task<LicencaResponse?> ReativarAsync(string id)
    {
        var licenca = await BuscarPorIdAsync(id);
        if (licenca is null) return null;
        await AtualizarAsync(id, new { ativo = true });
        licenca.Ativo = true;
        return MapResponse(licenca);
    }

    public async Task<LicencaResponse?> DesvincularMaquinaAsync(string id)
    {
        var licenca = await BuscarPorIdAsync(id);
        if (licenca is null) return null;
        var req = new HttpRequestMessage(new HttpMethod("PATCH"), $"licencas?id=eq.{Uri.EscapeDataString(id)}")
        {
            Content = new StringContent("""{"machine_id":null}""", System.Text.Encoding.UTF8, "application/json")
        };
        var res = await http.SendAsync(req);
        res.EnsureSuccessStatusCode();
        licenca.MachineId = null;
        return MapResponse(licenca);
    }

    private async Task<Licenca?> BuscarPorChaveAsync(string chave)
    {
        var res = await http.GetAsync($"licencas?chave=eq.{Uri.EscapeDataString(chave)}&limit=1");
        res.EnsureSuccessStatusCode();
        var lista = await res.Content.ReadFromJsonAsync<List<Licenca>>(JsonOpts);
        return lista?.FirstOrDefault();
    }

    private async Task<Licenca?> BuscarPorIdAsync(string id)
    {
        var res = await http.GetAsync($"licencas?id=eq.{Uri.EscapeDataString(id)}&limit=1");
        res.EnsureSuccessStatusCode();
        var lista = await res.Content.ReadFromJsonAsync<List<Licenca>>(JsonOpts);
        return lista?.FirstOrDefault();
    }

    public async Task<bool> DeletarAsync(string id)
    {
        var licenca = await BuscarPorIdAsync(id);
        if (licenca is null) return false;
        var res = await http.DeleteAsync($"licencas?id=eq.{Uri.EscapeDataString(id)}");
        res.EnsureSuccessStatusCode();
        return true;
    }

    private async Task AtualizarAsync(string id, object payload)
    {
        var req = new HttpRequestMessage(new HttpMethod("PATCH"), $"licencas?id=eq.{Uri.EscapeDataString(id)}")
        {
            Content = JsonContent.Create(payload, options: JsonOpts)
        };
        var res = await http.SendAsync(req);
        res.EnsureSuccessStatusCode();
    }

    private static string GerarChave()
    {
        static string Bloco() => Guid.NewGuid().ToString("N")[..4].ToUpper();
        return $"STANDBY-{Bloco()}-{Bloco()}-{Bloco()}";
    }

    private static LicencaResponse MapResponse(Licenca l) => new(
        l.Id,
        l.Chave,
        l.MachineId,
        l.ClienteNome,
        l.ExpiraEm,
        l.Ativo,
        l.ExpiraEm < DateTime.UtcNow
    );
}
