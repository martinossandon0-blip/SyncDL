#!/usr/bin/env python3
"""
SyncDL - Widevine Device Setup
Convierte client_id.bin + private_key.pem a device.wvd
Uso: python setup_wvd.py --client-id client_id.bin --private-key private_key.pem --output device.wvd
"""

import argparse
import sys
import subprocess
import os

def check_pywidevine():
    try:
        import pywidevine
        return True
    except ImportError:
        return False

def install_pywidevine():
    print("Instalando pywidevine...")
    result = subprocess.run([sys.executable, '-m', 'pip', 'install', 'pywidevine'], capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error instalando pywidevine: {result.stderr}")
        return False
    return True

def create_wvd(client_id_path, private_key_path, output_path):
    try:
        from pywidevine.device import Device
        from pywidevine import cdm
        import base64

        print(f"Leyendo client_id.bin desde: {client_id_path}")
        print(f"Leyendo private_key.pem desde: {private_key_path}")

        device = Device(
            type_=Device.DeviceTypes.ANDROID,
            security_level=3,
            flags={},
            private_key=open(private_key_path, 'rb').read(),
            client_id=open(client_id_path, 'rb').read()
        )

        device.dump(output_path)
        print(f"\n✓ device.wvd creado en: {output_path}")
        print("  Ahora ve a Ajustes > Apple Music > Seleccionar .wvd en SyncDL")
        return True

    except Exception as e:
        print(f"\n✗ Error: {e}")
        print("\nSi el error menciona 'security_level', prueba con:")
        print("  pywidevine create-device -t ANDROID -l 3 -k private_key.pem -c client_id.bin -o device.wvd")
        return False

def main():
    parser = argparse.ArgumentParser(description='Crear archivo .wvd desde claves Widevine L3')
    parser.add_argument('--client-id', default='client_id.bin', help='Ruta al archivo client_id.bin')
    parser.add_argument('--private-key', default='private_key.pem', help='Ruta al archivo private_key.pem')
    parser.add_argument('--output', default='device.wvd', help='Ruta de salida para device.wvd')
    args = parser.parse_args()

    print("=" * 50)
    print("  SyncDL - Widevine Device Setup")
    print("=" * 50)

    # Check files exist
    if not os.path.exists(args.client_id):
        print(f"✗ No se encontró: {args.client_id}")
        sys.exit(1)
    if not os.path.exists(args.private_key):
        print(f"✗ No se encontró: {args.private_key}")
        sys.exit(1)

    # Check / install pywidevine
    if not check_pywidevine():
        print("pywidevine no está instalado.")
        if not install_pywidevine():
            print("\nInstala manualmente: pip install pywidevine")
            sys.exit(1)

    # Create .wvd
    success = create_wvd(args.client_id, args.private_key, args.output)
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
