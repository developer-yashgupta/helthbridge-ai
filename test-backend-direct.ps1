# Test the backend directly to see what it returns
Write-Host "Testing backend voice assistant endpoint..." -ForegroundColor Cyan

$body = @{
    userId = "3dfd7ac0-8b57-46df-8232-9efe2750183c"
    message = "I have fever and headache"
    language = "en"
    patientInfo = @{
        age = 30
        gender = "male"
    }
} | ConvertTo-Json

Write-Host "`nRequest Body:" -ForegroundColor Yellow
Write-Host $body

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/voice-assistant/analyze" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -UseBasicParsing `
        -TimeoutSec 30

    Write-Host "`nStatus Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "`nResponse Body:" -ForegroundColor Yellow
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
} catch {
    Write-Host "`nError occurred:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        $responseBody = $reader.ReadToEnd()
        Write-Host "`nError Response Body:" -ForegroundColor Red
        Write-Host $responseBody
    }
}
