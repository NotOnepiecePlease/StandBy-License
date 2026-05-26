namespace StandBy.License.Models;

public class Licenca
{
    public string Id { get; set; } = string.Empty;
    public string Chave { get; set; } = string.Empty;
    public string? MachineId { get; set; }
    public string ClienteNome { get; set; } = string.Empty;
    public DateTime ExpiraEm { get; set; }
    public bool Ativo { get; set; }
    public DateTime CriadoEm { get; set; }
}
