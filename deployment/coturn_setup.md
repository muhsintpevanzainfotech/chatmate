# Coturn STUN/TURN Server Setup Guide (Ubuntu VPS)

This guide walks through configuring a self-hosted open-source **coturn** TURN server for WebRTC voice and video calls when users are behind strict NAT or symmetric firewalls.

## 1. Installation on Ubuntu VPS

```bash
sudo apt update
sudo apt install -y coturn
```

## 2. Enable Coturn Service

Edit `/etc/default/coturn`:

```bash
sudo nano /etc/default/coturn
```

Uncomment or add:

```text
TURNSERVER_ENABLED=1
```

## 3. Configure Turnserver (`/etc/turnserver.conf`)

Backup the default config and create a new clean configuration:

```bash
sudo mv /etc/turnserver.conf /etc/turnserver.conf.bak
sudo nano /etc/turnserver.conf
```

Paste the following configuration (replace `turn.yourdomain.com` with your actual domain and update IP addresses):

```ini
# Listening Ports
listening-port=3478
tls-listening-port=5349

# Realm & Public IP Settings
realm=turn.yourdomain.com
external-ip=YOUR_SERVER_PUBLIC_IP

# Authentication
fingerprint
lt-cred-mech
user=privacy_user:super_secure_turn_password

# Security & Protocols
no-cli
no-tlsv1
no-tlsv1_1
stale-nonce=600

# SSL Certificate (Let's Encrypt path)
cert=/etc/letsencrypt/live/turn.yourdomain.com/fullchain.pem
pkey=/etc/letsencrypt/live/turn.yourdomain.com/privkey.pem

# Log settings
log-file=/var/log/turnserver.log
verbose
```

## 4. Firewall Ports Configuration (UFW)

Open required TURN ports:

```bash
sudo ufw allow 3478/tcp
sudo ufw allow 3478/udp
sudo ufw allow 5349/tcp
sudo ufw allow 5349/udp
sudo ufw allow 49152:65535/udp
sudo ufw reload
```

## 5. Restart & Verify Service

```bash
sudo systemctl restart coturn
sudo systemctl status coturn
```

Verify ICE Connectivity using trickle-ice tool: `https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/`
Enter `turn:turn.yourdomain.com:3478` with your credentials and verify `srflx` and `relay` candidates are gathered.
