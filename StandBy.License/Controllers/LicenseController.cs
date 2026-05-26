using Microsoft.AspNetCore.Mvc;
using StandBy.License.DTOs;
using StandBy.License.Services;

namespace StandBy.License.Controllers;

[ApiController]
[Route("api/license")]
public class LicenseController(LicencaService licencaService) : ControllerBase
{
    [HttpPost("validate")]
    public async Task<ActionResult<ValidateResponse>> Validate([FromBody] ValidateRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Chave) || string.IsNullOrWhiteSpace(req.MachineId))
            return BadRequest(new { error = "Chave e MachineId são obrigatórios." });

        var response = await licencaService.ValidarAsync(req.Chave, req.MachineId);
        return Ok(response);
    }
}
