# Chuwue Grill - Test Suite 4 Pilares (PowerShell)
# Prueba integridad de todos los servicios

$global:accessToken = $null
$global:refreshToken = $null

function Test-ServiceHealth {
    param([string]$ServiceName, [string]$Endpoint)
    
    try {
        $response = Invoke-WebRequest -Uri "$Endpoint/docs" -Method Get -ErrorAction SilentlyContinue
        return $response.StatusCode -in @(200, 404)
    } catch {
        return $false
    }
}

function Print-Test {
    param([string]$Name, [bool]$Passed, [string]$Message = "")
    
    $status = if ($Passed) {
        Write-Host "✅ PASS" -ForegroundColor Green -NoNewline
    } else {
        Write-Host "❌ FAIL" -ForegroundColor Red -NoNewline
    }
    
    if ($Message) {
        Write-Host " | $Name - $Message"
    } else {
        Write-Host " | $Name"
    }
}

function Test-Pilar1-Auth {
    Write-Host "`n" + ("="*70) -ForegroundColor Blue
    Write-Host "  🔐 PILAR 1: AUTH SERVICE (8001)" -ForegroundColor Blue
    Write-Host ("="*70) -ForegroundColor Blue + "`n"
    
    $healthy = Test-ServiceHealth "Auth Service" "http://localhost:8001"
    Print-Test "Auth Service Health" $healthy
    
    if (-not $healthy) {
        Print-Test "Login User" $false "Service no disponible"
        return
    }
    
    try {
        # Test Login
        $loginData = @{
            username = "admin"
            password = "admin123"
        }
        
        $response = Invoke-WebRequest -Uri "http://localhost:8001/auth/login" `
            -Method POST `
            -Body ($loginData | ConvertTo-Json) `
            -ContentType "application/json" `
            -ErrorAction SilentlyContinue
        
        if ($response.StatusCode -eq 200) {
            $data = $response.Content | ConvertFrom-Json
            $global:accessToken = $data.access_token
            $global:refreshToken = $data.refresh_token
            Print-Test "Login User" $true "Token obtenido"
            
            # Test Get Current User
            $headers = @{"Authorization" = "Bearer $($global:accessToken)"}
            $response = Invoke-WebRequest -Uri "http://localhost:8001/auth/me" `
                -Headers $headers `
                -ErrorAction SilentlyContinue
            
            Print-Test "Get Current User" ($response.StatusCode -eq 200)
        } else {
            Print-Test "Login User" $false "Status: $($response.StatusCode)"
        }
    } catch {
        Print-Test "Auth Operations" $false $_.Exception.Message
    }
}

function Test-Pilar2-Payment {
    Write-Host "`n" + ("="*70) -ForegroundColor Blue
    Write-Host "  💳 PILAR 2: PAYMENT SERVICE (8002)" -ForegroundColor Blue
    Write-Host ("="*70) -ForegroundColor Blue + "`n"
    
    $healthy = Test-ServiceHealth "Payment Service" "http://localhost:8002"
    Print-Test "Payment Service Health" $healthy
    
    if (-not $healthy -or -not $global:accessToken) {
        Print-Test "Process Payment" $false "Service no disponible o sin token"
        return
    }
    
    try {
        $headers = @{"Authorization" = "Bearer $($global:accessToken)"}
        
        # Test Process Payment
        $paymentData = @{
            amount = 9999
            currency = "USD"
            customer_email = "cliente@chuwuegrill.com"
            description = "Pago por evento corporativo"
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest -Uri "http://localhost:8002/payments/process" `
            -Method POST `
            -Headers $headers `
            -Body $paymentData `
            -ContentType "application/json" `
            -ErrorAction SilentlyContinue
        
        Print-Test "Process Payment" ($response.StatusCode -eq 200) "Status: $($response.StatusCode)"
        
        # Test Register Partner
        $partnerData = @{
            name = "TestPartner_$(Get-Date -Format 'yyyyMMddHHmmss')"
            webhook_url = "http://localhost:8000/webhooks/"
            hmac_secret = "secret_$(Get-Random)"
            events = @("payment.succeeded", "reservation.confirmed")
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest -Uri "http://localhost:8002/partners/register" `
            -Method POST `
            -Headers $headers `
            -Body $partnerData `
            -ContentType "application/json" `
            -ErrorAction SilentlyContinue
        
        Print-Test "Register Partner B2B" ($response.StatusCode -in @(200, 201)) "Status: $($response.StatusCode)"
    } catch {
        Print-Test "Payment Operations" $false $_.Exception.Message
    }
}

function Test-Pilar3-AI {
    Write-Host "`n" + ("="*70) -ForegroundColor Blue
    Write-Host "  🤖 PILAR 3: AI ORCHESTRATOR (8003)" -ForegroundColor Blue
    Write-Host ("="*70) -ForegroundColor Blue + "`n"
    
    $healthy = Test-ServiceHealth "AI Orchestrator" "http://localhost:8003"
    Print-Test "AI Orchestrator Health" $healthy
    
    if (-not $healthy -or -not $global:accessToken) {
        Print-Test "Chat Message" $false "Service no disponible o sin token"
        return
    }
    
    try {
        $headers = @{"Authorization" = "Bearer $($global:accessToken)"}
        
        # Test Chat Message
        $chatData = @{
            message = "¿Qué platos de alitas tienes disponibles?"
            user_id = "user_001"
            session_id = "sess_$(Get-Random)"
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest -Uri "http://localhost:8003/chat/message" `
            -Method POST `
            -Headers $headers `
            -Body $chatData `
            -ContentType "application/json" `
            -TimeoutSec 10 `
            -ErrorAction SilentlyContinue
        
        Print-Test "Chat Message" ($response.StatusCode -eq 200) "Status: $($response.StatusCode)"
        
        # Test Get Tools
        $response = Invoke-WebRequest -Uri "http://localhost:8003/chat/tools" `
            -Headers $headers `
            -ErrorAction SilentlyContinue
        
        if ($response.StatusCode -eq 200) {
            $data = $response.Content | ConvertFrom-Json
            $toolCount = ($data.tools | Measure-Object).Count
            Print-Test "Get MCP Tools" $true "$toolCount herramientas disponibles"
        } else {
            Print-Test "Get MCP Tools" $false
        }
    } catch {
        Print-Test "AI Operations" $false $_.Exception.Message
    }
}

function Test-Pilar4-N8n {
    Write-Host "`n" + ("="*70) -ForegroundColor Blue
    Write-Host "  ⚡ PILAR 4: N8N EVENT BUS (5678)" -ForegroundColor Blue
    Write-Host ("="*70) -ForegroundColor Blue + "`n"
    
    $healthy = Test-ServiceHealth "n8n" "http://localhost:5678"
    Print-Test "n8n Health" $healthy
    
    try {
        # Test Payment Webhook
        $webhookData = @{
            event_type = "payment.succeeded"
            timestamp = [int](Get-Date -UFormat %s)
            data = @{
                transaction_id = "TXN-$(Get-Random)"
                amount = 9999
                currency = "USD"
            }
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest -Uri "http://localhost:5678/webhook/payment-success" `
            -Method POST `
            -Body $webhookData `
            -ContentType "application/json" `
            -ErrorAction SilentlyContinue
        
        Print-Test "Payment Webhook" ($response.StatusCode -in @(200, 201, 202)) "Status: $($response.StatusCode)"
        
        # Test Event Confirmed Webhook
        $eventData = @{
            event_type = "reservation.confirmed"
            timestamp = [int](Get-Date -UFormat %s)
            data = @{
                reservation_id = "RES-$(Get-Random)"
                guest_count = 50
                event_type = "corporativo"
            }
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest -Uri "http://localhost:5678/webhook/event-confirmed" `
            -Method POST `
            -Body $eventData `
            -ContentType "application/json" `
            -ErrorAction SilentlyContinue
        
        Print-Test "Event Webhook" ($response.StatusCode -in @(200, 201, 202)) "Status: $($response.StatusCode)"
    } catch {
        Print-Test "n8n Operations" $false $_.Exception.Message
    }
}

function Test-WebhooksB2B {
    Write-Host "`n" + ("="*70) -ForegroundColor Blue
    Write-Host "  📡 WEBHOOKS BIDIRECCIONALES B2B" -ForegroundColor Blue
    Write-Host ("="*70) -ForegroundColor Blue + "`n"
    
    try {
        # Webhook: Chuwue → FindYourWork
        $chuwueData = @{
            event_type = "event.reservation_confirmed"
            timestamp = [int](Get-Date -UFormat %s)
            data = @{
                event_id = "EVT-$(Get-Random)"
                guest_count = 50
                event_type = "corporativo"
            }
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest -Uri "http://localhost:8000/webhooks/chuwue/event-confirmed/" `
            -Method POST `
            -Body $chuwueData `
            -ContentType "application/json" `
            -ErrorAction SilentlyContinue
        
        Print-Test "Webhook: Chuwue → FindYourWork" ($response.StatusCode -in @(200, 201, 404)) "Status: $($response.StatusCode)"
        
        # Webhook: FindYourWork → Chuwue
        $partnerData = @{
            event_type = "service.booked_for_event"
            timestamp = [int](Get-Date -UFormat %s)
            data = @{
                service_id = "SRV-$(Get-Random)"
                event_id = "EVT-$(Get-Random)"
                service_type = "fotografia"
            }
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest -Uri "http://localhost:8002/webhooks/partner/" `
            -Method POST `
            -Body $partnerData `
            -ContentType "application/json" `
            -ErrorAction SilentlyContinue
        
        Print-Test "Webhook: FindYourWork → Chuwue" ($response.StatusCode -in @(200, 201, 202)) "Status: $($response.StatusCode)"
    } catch {
        Print-Test "B2B Webhooks" $false $_.Exception.Message
    }
}

function Run-AllTests {
    Write-Host "`n`n" -ForegroundColor Cyan
    Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║   🧪 CHUWUE GRILL - TEST SUITE (4 PILARES - PowerShell)          ║" -ForegroundColor Cyan
    Write-Host "║   Proyecto Autónomo - Segundo Parcial                             ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    
    Test-Pilar1-Auth
    Test-Pilar2-Payment
    Test-Pilar3-AI
    Test-Pilar4-N8n
    Test-WebhooksB2B
    
    Write-Host "`n" + ("="*70) -ForegroundColor Green
    Write-Host "  ✅ TEST SUITE COMPLETADO" -ForegroundColor Green
    Write-Host ("="*70) -ForegroundColor Green + "`n"
}

# Ejecutar todas las pruebas
Run-AllTests
