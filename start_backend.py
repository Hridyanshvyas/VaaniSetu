#!/usr/bin/env python3
"""
VaaniSetu All-in-One Service Launcher for Windows / Linux
Starts all 4 microservices concurrently:
  - Backend (:8000)
  - STT Service (:8001)
  - TTS Service (:8002)
  - Translation Service (:8004)

Detects and displays local IP addresses for easy mobile connection.
"""

import json
import os
import socket
import subprocess
import sys
import time
import urllib.request

# Ensure UTF-8 output encoding across all Windows terminals
try:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass


def get_local_ips():
    ips = []
    try:
        hostname = socket.gethostname()
        for info in socket.getaddrinfo(hostname, None, socket.AF_INET):
            ip = info[4][0]
            if ip and not ip.startswith("127.") and ip not in ips:
                ips.append(ip)
    except Exception:
        pass

    if not ips:
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ips.append(s.getsockname()[0])
            s.close()
        except Exception:
            pass
    return ips


def check_service_health(url, timeout=2.0):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "VaaniSetuLauncher/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode("utf-8"))
                return True, data
    except Exception:
        pass
    return False, None


def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    if root_dir not in sys.path:
        sys.path.insert(0, root_dir)
    os.chdir(root_dir)

    # Use virtual environment python if available
    venv_py = os.path.join(root_dir, ".venv", "Scripts", "python.exe")
    if not os.path.exists(venv_py):
        venv_py = os.path.join(root_dir, ".venv", "bin", "python")
    if not os.path.exists(venv_py):
        venv_py = sys.executable

    env = os.environ.copy()
    existing_pythonpath = env.get("PYTHONPATH", "")
    env["PYTHONPATH"] = f"{root_dir}{os.pathsep}{existing_pythonpath}" if existing_pythonpath else root_dir
    env["PYTHONIOENCODING"] = "utf-8"
    env["HF_LOCAL_FILES_ONLY"] = "true"
    env["FAST_TTS"] = "true"
    env["TRANSLATION_NUM_BEAMS"] = "1"
    env["CHANNEL_LATENCY"] = "0.05"
    env["CHANNEL_BPS"] = "2400"
    env["OMP_NUM_THREADS"] = str(os.cpu_count() or 8)
    env["MKL_NUM_THREADS"] = str(os.cpu_count() or 8)
    env["STT_SERVICE_URL"] = "http://127.0.0.1:8001"
    env["TTS_SERVICE_URL"] = "http://127.0.0.1:8002"
    env["TRANSLATION_SERVICE_URL"] = "http://127.0.0.1:8004"
    env["ML_SERVICE_TIMEOUT_SECONDS"] = "300"

    print("=" * 68)
    print("      VaaniSetu (Vaani Setu) -- Multi-Service Stack Launcher")
    print("      SIH 2026 - AI Voice Bridge for Weak Radio/Network Links")
    print("=" * 68)

    local_ips = get_local_ips()
    print("\n[+] Detected Host IP Addresses:")
    for ip in local_ips:
        print(f"    -> http://{ip}:8000  (Enter '{ip}:8000' in the Mobile App)")
    print("    -> http://127.0.0.1:8000 (Local PC / Web)")
    print("    -> http://10.0.2.2:8000 (Android Emulator)")
    print()

    services = [
        {"name": "STT Service", "port": 8001, "cmd": [venv_py, "-m", "uvicorn", "ml.stt_service.app:app", "--app-dir", root_dir, "--host", "127.0.0.1", "--port", "8001", "--log-level", "warning"]},
        {"name": "TTS Service", "port": 8002, "cmd": [venv_py, "-m", "uvicorn", "ml.tts_service.app:app", "--app-dir", root_dir, "--host", "127.0.0.1", "--port", "8002", "--log-level", "warning"]},
        {"name": "Translation Service", "port": 8004, "cmd": [venv_py, "-m", "uvicorn", "ml.translation_service.app:app", "--app-dir", root_dir, "--host", "127.0.0.1", "--port", "8004", "--log-level", "warning"]},
        {"name": "Backend Gateway", "port": 8000, "cmd": [venv_py, "-m", "uvicorn", "backend.main:app", "--app-dir", root_dir, "--host", "0.0.0.0", "--port", "8000", "--log-level", "info"]},
    ]

    processes = []
    print("[+] Starting services...")
    try:
        for svc in services:
            print(f"    Starting {svc['name']} on port {svc['port']}...")
            p = subprocess.Popen(svc["cmd"], env=env, cwd=root_dir)
            processes.append((svc["name"], p, svc["port"]))

        print("\n[+] Waiting for services to initialize...")
        time.sleep(3)

        # Health checks
        all_ready = False
        for attempt in range(15):
            results = []
            for name, _, port in processes:
                ok, _ = check_service_health(f"http://127.0.0.1:{port}/health")
                results.append(ok)
            if all(results):
                all_ready = True
                break
            time.sleep(1)

        print("\n" + "-" * 68)
        for name, _, port in processes:
            ok, data = check_service_health(f"http://127.0.0.1:{port}/health")
            status_str = "[OK] ONLINE" if ok else "[..] STARTING"
            print(f"  {status_str:13} {name:22} -> http://127.0.0.1:{port}/health")
        print("-" * 68)

        if all_ready:
            print("\n[+] All 4 VaaniSetu services are active and ready!")
            print("[+] Open VaaniSetu APK on your phone, verify the IP, and start speaking.")
        else:
            print("\n[!] Note: Heavy AI models load lazily on first speech exchange.")

        print("\nPress Ctrl+C to stop all services.\n")

        # Keep running and monitor processes
        while True:
            for name, proc, _ in processes:
                ret = proc.poll()
                if ret is not None:
                    print(f"[!] Warning: Process {name} exited with code {ret}")
            time.sleep(1)

    except KeyboardInterrupt:
        print("\n[+] Stopping all services...")
        for name, proc, _ in processes:
            try:
                proc.terminate()
            except Exception:
                pass
        time.sleep(1)
        for name, proc, _ in processes:
            try:
                proc.kill()
            except Exception:
                pass
        print("[+] All services stopped cleanly.")


if __name__ == "__main__":
    main()
