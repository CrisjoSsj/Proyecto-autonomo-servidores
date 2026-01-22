#!/usr/bin/env python3
"""
Auto-import workflows to n8n by copying JSON files to n8n data directory
"""

import json
import os
import time
import subprocess
from pathlib import Path

# Paths
WORKFLOWS_DIR = r"c:\Users\joustin\Desktop\Proyecto-autonomo-servidores\n8n\workflows"
CONTAINER_NAME = "chuwue-n8n"

def get_n8n_data_path():
    """Get the n8n data directory from docker"""
    try:
        result = subprocess.run(
            ["docker", "inspect", CONTAINER_NAME, "--format={{.Mounts}}"],
            capture_output=True,
            text=True
        )
        print(f"[INFO] Docker inspect output: {result.stdout}")
        return result.stdout.strip()
    except Exception as e:
        print(f"[ERROR] Failed to get n8n data path: {e}")
        return None

def copy_workflows_to_n8n():
    """Copy workflow JSON files to n8n container"""
    workflows = [f for f in os.listdir(WORKFLOWS_DIR) if f.endswith('.json')]
    
    if not workflows:
        print("[WARNING] No workflow files found in n8n/workflows/")
        return False
    
    print(f"[INFO] Found {len(workflows)} workflow files to import")
    
    for workflow_file in workflows:
        source = os.path.join(WORKFLOWS_DIR, workflow_file)
        
        # Copy file to n8n container workflows directory
        container_dest = f"/home/node/.n8n/workflows/{workflow_file}"
        
        try:
            cmd = ["docker", "cp", source, f"{CONTAINER_NAME}:{container_dest}"]
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                print(f"✅ Copied {workflow_file} to n8n container")
            else:
                print(f"❌ Failed to copy {workflow_file}: {result.stderr}")
                
        except Exception as e:
            print(f"❌ Error copying {workflow_file}: {e}")
    
    return True

def restart_n8n():
    """Restart n8n container to reload workflows"""
    try:
        print("[INFO] Restarting n8n container...")
        subprocess.run(["docker", "restart", CONTAINER_NAME], capture_output=True)
        time.sleep(3)
        print("✅ n8n restarted")
        return True
    except Exception as e:
        print(f"❌ Failed to restart n8n: {e}")
        return False

def wait_for_n8n():
    """Wait for n8n to be available"""
    max_attempts = 30
    for attempt in range(max_attempts):
        try:
            result = subprocess.run(
                ["docker", "exec", CONTAINER_NAME, "curl", "-s", "http://localhost:5678/"],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                print("✅ n8n is available")
                return True
        except:
            pass
        
        print(f"[{attempt+1}/{max_attempts}] Waiting for n8n to be ready...")
        time.sleep(2)
    
    print("❌ n8n did not start in time")
    return False

if __name__ == "__main__":
    print("=" * 50)
    print("n8n Workflow Auto-Import")
    print("=" * 50)
    
    # Copy workflows to container
    if copy_workflows_to_n8n():
        # Restart n8n to reload workflows
        if restart_n8n():
            # Wait for it to be ready
            if wait_for_n8n():
                print("\n" + "=" * 50)
                print("✅ Workflows imported successfully!")
                print("=" * 50)
                print("\nAccess n8n at: http://localhost:5678")
                print("Email: admin@chuwue.com")
                print("Password: admin123")
                print("\nWorkflow endpoints:")
                print("  - http://localhost:5678/webhook/stripe")
                print("  - http://localhost:5678/webhook/payu")
                print("  - http://localhost:5678/webhook/mercadopago")
                print("  - http://localhost:5678/webhook/partner")
            else:
                print("❌ n8n failed to start")
        else:
            print("❌ Failed to restart n8n")
    else:
        print("❌ Failed to copy workflows")
