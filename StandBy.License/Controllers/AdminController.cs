using Microsoft.AspNetCore.Mvc;
using StandBy.License.DTOs;
using StandBy.License.Services;

namespace StandBy.License.Controllers;

[ApiController]
[Route("api/admin/licencas")]
public class AdminController(LicencaService licencaService, IConfiguration config) : ControllerBase
{
    // proteção simples via header — troca por auth real se necessário
    private bool AdminAutorizado()
    {
        var adminKey = config["Admin:ApiKey"];
        Request.Headers.TryGetValue("X-Admin-Key", out var headerKey);
        return !string.IsNullOrEmpty(adminKey) && headerKey == adminKey;
    }

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        if (!AdminAutorizado()) return Unauthorized();
        return Ok(await licencaService.ListarAsync());
    }

    [HttpPost]
    public async Task<IActionResult> Criar([FromBody] CriarLicencaRequest req)
    {
        if (!AdminAutorizado()) return Unauthorized();
        var licenca = await licencaService.CriarAsync(req);
        return CreatedAtAction(nameof(Listar), licenca);
    }

    [HttpPost("{id}/renovar")]
    public async Task<IActionResult> Renovar(string id, [FromBody] RenovarLicencaRequest req)
    {
        if (!AdminAutorizado()) return Unauthorized();
        var licenca = await licencaService.RenovarAsync(id, req);
        if (licenca is null) return NotFound();
        return Ok(licenca);
    }

    [HttpPost("{id}/revogar")]
    public async Task<IActionResult> Revogar(string id)
    {
        if (!AdminAutorizado()) return Unauthorized();
        var licenca = await licencaService.RevogarAsync(id);
        if (licenca is null) return NotFound();
        return Ok(licenca);
    }

    [HttpPost("{id}/reativar")]
    public async Task<IActionResult> Reativar(string id)
    {
        if (!AdminAutorizado()) return Unauthorized();
        var licenca = await licencaService.ReativarAsync(id);
        if (licenca is null) return NotFound();
        return Ok(licenca);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Deletar(string id)
    {
        if (!AdminAutorizado()) return Unauthorized();
        var ok = await licencaService.DeletarAsync(id);
        if (!ok) return NotFound();
        return NoContent();
    }

    [HttpPost("{id}/desvincular")]
    public async Task<IActionResult> DesvincularMaquina(string id)
    {
        if (!AdminAutorizado()) return Unauthorized();
        var licenca = await licencaService.DesvincularMaquinaAsync(id);
        if (licenca is null) return NotFound();
        return Ok(licenca);
    }
}
