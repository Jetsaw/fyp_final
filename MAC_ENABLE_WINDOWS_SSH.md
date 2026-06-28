# Enable Windows SSH Access To This Mac

Run this on the Mac mini Terminal if Windows cannot SSH into the Mac yet.

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
grep -qxF 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIILdPjCHXNvPQNq2afkWgH/Bk44eQWaxr7eRVBn+3cFU your_email@example.com' ~/.ssh/authorized_keys 2>/dev/null || echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIILdPjCHXNvPQNq2afkWgH/Bk44eQWaxr7eRVBn+3cFU your_email@example.com' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
whoami
hostname
```

Send the `whoami` output back to Windows Codex.

Windows will then test:

```powershell
ssh THE_WHOAMI_OUTPUT@192.168.31.82 "whoami; hostname"
```
