using Microsoft.AspNetCore.Mvc;
using StandBy.License.DTOs;
using StandBy.License.Services;

namespace StandBy.License.Controllers;

[ApiController]
[Route("api/license")]
public class LicenseController(LicencaService licencaService, IConfiguration config) : ControllerBase
{
    private bool BackendAutorizado()
    {
        // Railway injeta como SERVICE_SECRET; appsettings usa ServiceSecret (dev local)
        var secret = config["SERVICE_SECRET"] ?? config["ServiceSecret"];
        if (string.IsNullOrEmpty(secret)) return true;
        Request.Headers.TryGetValue("X-StandBy-Secret", out var headerSecret);
        return headerSecret == secret;
    }

    [HttpPost("validate")]
    public async Task<ActionResult<ValidateResponse>> Validate([FromBody] ValidateRequest req)
    {
        if (!BackendAutorizado()) return Unauthorized();

        if (string.IsNullOrWhiteSpace(req.Chave) || string.IsNullOrWhiteSpace(req.MachineId))
            return BadRequest(new { error = "Chave e MachineId são obrigatórios." });

        var response = await licencaService.ValidarAsync(req.Chave, req.MachineId);
        return Ok(response);
    }
}
