# Chuwue Grill - Test Suite Webhooks (PowerShell)
# Prueba todos los webhooks de integración

function Test-WebhookStripe {
    Write-Host "`n✅ Testing Stripe Webhook..." -ForegroundColor Green
    
    $payload = @{
        id = "evt_test_$(Get-Date -Format 'yyyyMMddHHmmss')"
        type = "charge.succeeded"
        created = [int](Get-Date -UFormat %s)
        data = @{
            object = @{
                id = "ch_test_$(Get-Random)"
                amount = 9999
                currency = "usd"
                status = "succeeded"
            }
        }
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8002/webhooks/payments/stripe/" `
            -Method POST `
            -Body $payload `
            -ContentType "application/json" `
            -ErrorAction SilentlyContinue
        
        if ($response.StatusCode -in @(200, 201, 202)) {
            Write-Host "  Status: $($response.StatusCode) - ✅ PASS" -ForegroundColor Green
            return $true
        } else {
            Write-Host "  Status: $($response.StatusCode) - ❌ FAIL" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "  ❌ Error: $_" -ForegroundColor Red
        return $false
    }
}

function Test-WebhookMercadoPago {
    Write-Host "`n✅ Testing MercadoPago Webhook..." -ForegroundColor Green
    
    $payload = @{
        id = Get-Date -UFormat %s
        type = "payment"
        data = @{
            id = "payment_$(Get-Random)"
            status = "approved"
        }
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8002/webhooks/payments/mercadopago/" `
            -Method POST `
            -Body $payload `
            -ContentType "application/json" `
            -ErrorAction SilentlyContinue
        
        if ($response.StatusCode -in @(200, 201)) {
            Write-Host "  Status: $($response.StatusCode) - ✅ PASS" -ForegroundColor Green
            return $true
        } else {
            Write-Host "  Status: $($response.StatusCode) - ❌ FAIL" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "  ❌ Error: $_" -ForegroundColor Red
        return $false
    }
}

function Test-WebhookPayU {
    Write-Host "`n✅ Testing PayU Webhook..." -ForegroundColor Green
    
    $payload = @{
        reference_sale = "SALE_$(Get-Random)"
        value = "99.99"
        currency = "USD"
        state_pol = "4"
        response_code_pol = "1"
    }
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8002/webhooks/payments/payu/" `
            -Method POST `
            -Body $payload `
            -ErrorAction SilentlyContinue
        
        if ($response.StatusCode -in @(200, 201)) {
            Write-Host "  Status: $($response.StatusCode) - ✅ PASS" -ForegroundColor Green
            return $true
        } else {
            Write-Host "  Status: $($response.StatusCode) - ❌ FAIL" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "  ❌ Error: $_" -ForegroundColor Red
        return $false
    }
}

function Test-WebhookPartner {
    Write-Host "`n✅ Testing Partner B2B Webhook..." -ForegroundColor Green
    
    $payload = @{
        event_type = "service.booked_for_event"
        timestamp = [int](Get-Date -UFormat %s)
        data = @{
            service_id = "SRV-$(Get-Random)"
            event_id = "EVT-$(Get-Random)"
            service_type = "fotografia"
        }
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8002/webhooks/partner/" `
            -Method POST `
            -Body $payload `
            -ContentType "application/json" `
            -Headers @{"X-Webhook-Signature" = "sha256=test"} `
            -ErrorAction SilentlyContinue
        
        if ($response.StatusCode -in @(200, 201)) {
            Write-Host "  Status: $($response.StatusCode) - ✅ PASS" -ForegroundColor Green
            return $true
        } else {
            Write-Host "  Status: $($response.StatusCode) - ❌ FAIL" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "  ❌ Error: $_" -ForegroundColor Red
        return $false
    }
}

function Test-N8nPaymentWebhook {
    Write-Host "`n✅ Testing n8n Payment Webhook..." -ForegroundColor Green
    
    $payload = @{
        event_type = "payment.succeeded"
        timestamp = [int](Get-Date -UFormat %s)
        data = @{
            transaction_id = "TXN-$(Get-Random)"
            amount = 9999
            currency = "USD"
        }
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5678/webhook/payment-success" `
            -Method POST `
            -Body $payload `
            -ContentType "application/json" `
            -ErrorAction SilentlyContinue
        
        if ($response.StatusCode -in @(200, 201, 202)) {
            Write-Host "  Status: $($response.StatusCode) - ✅ PASS" -ForegroundColor Green
            return $true
        } else {
            Write-Host "  Status: $($response.StatusCode) - ❌ FAIL" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "  ❌ Error: $_" -ForegroundColor Red
        return $false
    }
}

function Test-N8nEventWebhook {
    Write-Host "`n✅ Testing n8n Event Webhook..." -ForegroundColor Green
    
    $payload = @{
        event_type = "reservation.confirmed"
        timestamp = [int](Get-Date -UFormat %s)
        data = @{
            reservation_id = "RES-$(Get-Random)"
            guest_count = 50
            event_type = "corporativo"
        }
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5678/webhook/event-confirmed" `
            -Method POST `
            -Body $payload `
            -ContentType "application/json" `
            -ErrorAction SilentlyContinue
        
        if ($response.StatusCode -in @(200, 201, 202)) {
            Write-Host "  Status: $($response.StatusCode) - ✅ PASS" -ForegroundColor Green
            return $true
        } else {
            Write-Host "  Status: $($response.StatusCode) - ❌ FAIL" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "  ❌ Error: $_" -ForegroundColor Red
        return $false
    }
}

function Run-AllTests {
    Write-Host "`n" + ("="*70) -ForegroundColor Cyan
    Write-Host "  🪝 CHUWUE GRILL - WEBHOOK TEST SUITE (PowerShell)" -ForegroundColor Cyan
    Write-Host ("="*70) -ForegroundColor Cyan
    
    $results = @()
    
    $results += @{ name = "Stripe Webhook"; passed = Test-WebhookStripe }
    $results += @{ name = "MercadoPago Webhook"; passed = Test-WebhookMercadoPago }
    $results += @{ name = "PayU Webhook"; passed = Test-WebhookPayU }
    $results += @{ name = "Partner B2B Webhook"; passed = Test-WebhookPartner }
    $results += @{ name = "n8n Payment Webhook"; passed = Test-N8nPaymentWebhook }
    $results += @{ name = "n8n Event Webhook"; passed = Test-N8nEventWebhook }
    
    # Resumen
    $passed = ($results | Where-Object { $_.passed } | Measure-Object).Count
    $total = $results.Count
    
    Write-Host "`n" + ("="*70) -ForegroundColor Cyan
    Write-Host "  📊 RESUMEN: $passed/$total webhooks funcionando" -ForegroundColor Cyan
    Write-Host ("="*70) -ForegroundColor Cyan + "`n"
    
    foreach ($result in $results) {
        if ($result.passed) {
            Write-Host "  ✅ PASS - $($result.name)" -ForegroundColor Green
        } else {
            Write-Host "  ❌ FAIL - $($result.name)" -ForegroundColor Red
        }
    }
    
    Write-Host "`n"
}

# Ejecutar todas las pruebas
Run-AllTests
