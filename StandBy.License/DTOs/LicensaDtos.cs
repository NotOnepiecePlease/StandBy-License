namespace StandBy.License.DTOs;

public record ValidateRequest(string Chave, string MachineId);

public record ValidateResponse(
    bool Valid,
    string? ClienteNome,
    DateTime? ExpiraEm,
    string? Motivo
);

public record CriarLicencaRequest(
    string ClienteNome,
    int DuracaoMeses
);

public record LicencaResponse(
    string Id,
    string Chave,
    string? MachineId,
    string ClienteNome,
    DateTime ExpiraEm,
    bool Ativo,
    bool Expirada
);

public record RenovarLicencaRequest(int DuracaoMeses);
