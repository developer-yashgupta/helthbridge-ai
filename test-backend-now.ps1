$body = @{
    userId = "3dfd7ac0-8b57-46df-8232-9efe2750183c"
    message = "I have a headache and fever"
    language = "en"
    patientInfo = @{
        age = 30
        gender = "male"
        location = @{
            village = "Test Village"
            district = "Test District"
        }
    }
} | ConvertTo-Json -Depth 10

Write-Host "Testing backend voice assistant API..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Request:" -ForegroundColor Yellow
Write-Host $body
Write-Host ""
Write-Host "Sending request..." -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/voice-assistant/analyze" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -UseBasicParsing

    Write-Host "Response status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response data:" -ForegroundColor Yellow
    $data = $response.Content | ConvertFrom-Json
    Write-Host ($data | ConvertTo-Json -Depth 10)
    
    if ($data.success) {
        Write-Host ""
        Write-Host "✅ SUCCESS!" -ForegroundColor Green
        Write-Host "AI Response: $($data.response)" -ForegroundColor Cyan
        Write-Host "Severity: $($data.routing.severity)" -ForegroundColor Cyan
        Write-Host "Facility Type: $($data.routing.facilityType)" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "❌ FAILED!" -ForegroundColor Red
        Write-Host "Error: $($data.error)" -ForegroundColor Red
    }
} catch {
    Write-Host ""
    Write-Host "❌ ERROR!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response body: $responseBody" -ForegroundColor Red
    }
}
