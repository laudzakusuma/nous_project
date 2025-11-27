import subprocess
import json
import time
import requests
import nacl.signing
import nacl.encoding
import sys

PACKAGE_ID   = "0x3fddf8dfdbf68179786935a369c2f8c22ac433f2d83e00b197c7fbcb490939bc"
BRAIN_ID     = "0x1d9f6e1422c9d0c398a15deb0dd49a5274ceed3cdb2a72bbc4c858311fb364a3"
ADMIN_CAP_ID = "0x78163973b9f52cd1b597d5121be648da75b7b0fccbbdc2d4e3b6fb54dba6287b"
MODULE       = "aeterna"
FUNCTION     = "consult_brain"
GAS_BUDGET   = "50000000"
FEE_AMOUNT   = 1000000000

class NousBot:
    def __init__(self):
        print("\nINITIALIZING NOUS ULTRA BOT...")
        self.signing_key = None
        self.public_key_str = None
        self.setup_keys()

    def setup_keys(self):
        """Membuat Kunci Kriptografi Ephemeral"""
        self.signing_key = nacl.signing.SigningKey.generate()
        verify_key = self.signing_key.verify_key
        pub_bytes = list(verify_key.encode())
        self.public_key_str = json.dumps(pub_bytes)
        print("Crypto Keys Generated.")

    def run_command(self, cmd_list):
        """Eksekusi Perintah CLI dengan Pembersihan Output JSON"""
        try:
            result = subprocess.run(cmd_list, capture_output=True, text=True, encoding='utf-8')
            raw_output = result.stdout.strip()
            
            if not raw_output:
                return None, result.stderr

            json_start = raw_output.find('{')
            list_start = raw_output.find('[')
            
            start_index = -1
            if json_start != -1 and list_start != -1:
                start_index = min(json_start, list_start)
            elif json_start != -1:
                start_index = json_start
            elif list_start != -1:
                start_index = list_start
            
            if start_index != -1:
                clean_json = raw_output[start_index:]
                return json.loads(clean_json), None
            else:
                return None, raw_output
        except Exception as e:
            return None, str(e)

    def find_wallets(self):
        """
        FITUR CANGGIH: Mencari koin secara otomatis
        Mencari 1 Koin > 1 SUI (Untuk Bayar)
        Mencari 1 Koin Lain > 0.05 SUI (Untuk Gas)
        """
        print("Scanning Blockchain Wallet...")
        cmd = ["sui", "client", "gas", "--json"]
        coins, error = self.run_command(cmd)
        
        if not coins:
            print(f"Gagal membaca wallet: {error}")
            sys.exit(1)

        coins.sort(key=lambda x: int(x['mistBalance']), reverse=True)
        payment_coin = None
        gas_coin = None

        for coin in coins:
            balance = int(coin['mistBalance'])
            if balance >= FEE_AMOUNT:
                payment_coin = coin['gasCoinId']
                print(f"   Payment Coin Found: {payment_coin[:10]}... (Saldo: {balance/10**9:.2f} SUI)")
                break
        
        if not payment_coin:
            print("ERROR: Tidak ada koin dengan saldo minimal 1 SUI untuk bayar AI.")
            sys.exit(1)

        for coin in coins:
            cid = coin['gasCoinId']
            balance = int(coin['mistBalance'])
            if cid != payment_coin and balance > 50000000:
                gas_coin = cid
                print(f"   Gas Coin Found    : {gas_coin[:10]}... (Saldo: {balance/10**9:.2f} SUI)")
                break
        
        if not gas_coin:
            print("ERROR: Tidak ada koin terpisah untuk Gas Fee. Lakukan Split Coin lagi.")
            sys.exit(1)
            
        return payment_coin, gas_coin

    def register_oracle(self):
        """Mendaftarkan Public Key (Idempotent: Lanjut meski gagal/sudah ada)"""
        print("Checking Oracle Registration...")
        cmd = [
            "sui", "client", "call",
            "--package", PACKAGE_ID, "--module", MODULE, "--function", "set_oracle_key",
            "--args", ADMIN_CAP_ID, BRAIN_ID, self.public_key_str,
            "--gas-budget", GAS_BUDGET, "--json"
        ]
        subprocess.run(cmd, capture_output=True)

    def get_market_vector(self):
        """Mengambil Data BTC Real-time"""
        print("Fetching Bitcoin Market Data...")
        try:
            url = "https://api.coingecko.com/api/v3/coins/bitcoin/ohlc?vs_currency=usd&days=1"
            data = requests.get(url).json()[-5:]
            prices = [x[4] for x in data]
            base = prices[0]
            vector = [int((p/base)*100) for p in prices]
            
            print(f"   Prices: {prices}")
            print(f"   Vector: {vector}")
            return vector
        except Exception as e:
            print(f"API Error ({e}), using dummy data.")
            return [100, 105, 110, 115, 120]

    def execute_consultation(self):
        payment_id, gas_id = self.find_wallets()
        self.register_oracle()
        vector_data = self.get_market_vector()
        timestamp_ms = int(time.time() * 1000)
        message = str(timestamp_ms).encode()
        signed = self.signing_key.sign(message)
        signature_bytes = list(signed.signature)
        print(f"\n EXECUTING SMART CONTRACT...")
        print("   Sending Encrypted Vector Payload...")
        
        cmd = [
            "sui", "client", "call",
            "--package", PACKAGE_ID,
            "--module", MODULE,
            "--function", FUNCTION,
            "--args", 
                BRAIN_ID, 
                "0x6",
                payment_id,
                json.dumps(vector_data), 
                str(timestamp_ms), 
                json.dumps(signature_bytes),
            "--gas", gas_id,
            "--gas-budget", GAS_BUDGET,
            "--json"
        ]

        result, error = self.run_command(cmd)
        
        if result and "digest" in result:
            print("\n" + "="*50)
            print(f"MISSION ACCOMPLISHED")
            print(f"Tx Digest: {result['digest']}")
            print("="*50)
            print("[INFO] Cek Explorer untuk melihat InsightNFT yang baru dicetak!")
        else:
            print("\n TRANSACTION FAILED")
            print(f"Error Log: {error}")
            if result: print(result)

if __name__ == "__main__":
    bot = NousBot()
    bot.execute_consultation()