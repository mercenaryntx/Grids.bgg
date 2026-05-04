using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHttpClient("bgg", client =>
{
    client.BaseAddress = new Uri("https://boardgamegeek.com/xmlapi2/");
    client.DefaultRequestHeaders.Add("User-Agent", "BggGrids/1.0");
    var apiKey = builder.Configuration["Bgg:ApiKey"];
    if (!string.IsNullOrEmpty(apiKey))
        client.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");
    client.Timeout = TimeSpan.FromSeconds(30);
});

builder.Services.AddHttpClient("image");

var app = builder.Build();

// ── BGG XML proxy ─────────────────────────────────────────────────────────────

app.MapGet("/api/bgg/search", async (string query, IHttpClientFactory factory) =>
{
    var client = factory.CreateClient("bgg");
    var url = $"search?query={Uri.EscapeDataString(query)}&type=boardgame";
    var response = await client.GetAsync(url);
    var xml = await response.Content.ReadAsStringAsync();
    return Results.Content(xml, "application/xml");
});

app.MapGet("/api/bgg/thing", async (string id, IHttpClientFactory factory) =>
{
    var client = factory.CreateClient("bgg");
    var url = $"thing?id={Uri.EscapeDataString(id)}&type=boardgame";
    var response = await client.GetAsync(url);
    var xml = await response.Content.ReadAsStringAsync();
    return Results.Content(xml, "application/xml");
});

app.MapGet("/api/bgg/collection", async (string username, IHttpClientFactory factory, HttpContext ctx) =>
{
    var client = factory.CreateClient("bgg");
    var url = $"collection?username={Uri.EscapeDataString(username)}&own=1&subtype=boardgame&excludesubtype=boardgameexpansion";
    HttpResponseMessage? response = null;

    // BGG returns 202 Accepted while the data is being prepared; retry up to 5 times
    for (var i = 0; i < 5; i++)
    {
        response = await client.GetAsync(url);
        if ((int)response.StatusCode != 202)
            break;
        await Task.Delay(2000);
    }

    var xml = await response!.Content.ReadAsStringAsync();
    ctx.Response.StatusCode = (int)response.StatusCode;
    return Results.Content(xml, "application/xml");
});

// Image proxy so html2canvas can capture cross-origin thumbnails
app.MapGet("/api/bgg/image", async (string url, IHttpClientFactory factory) =>
{
    try
    {
        var client = factory.CreateClient("image");
        var response = await client.GetAsync(url);
        var bytes = await response.Content.ReadAsByteArrayAsync();
        var ct = response.Content.Headers.ContentType?.ToString() ?? "image/jpeg";
        return Results.Bytes(bytes, ct);
    }
    catch
    {
        return Results.NotFound();
    }
});

// ── SPA static files ──────────────────────────────────────────────────────────

var spaPath = Path.Combine(builder.Environment.ContentRootPath, "ClientApp", "dist");
if (Directory.Exists(spaPath))
{
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(spaPath),
        RequestPath = ""
    });

    app.MapFallback(async ctx =>
    {
        ctx.Response.ContentType = "text/html";
        await ctx.Response.SendFileAsync(Path.Combine(spaPath, "index.html"));
    });
}
else
{
    app.MapGet("/", () => Results.Content(
        "<h1>BggGrids</h1><p>Run <code>npm run build</code> inside <code>ClientApp/</code> first, or start the Vite dev server.</p>",
        "text/html"));
}

app.Run();
