import subprocess
import os

print("Copying import script into Docker container sapfs_db...")
cmd = 'docker exec -i sapfs_db psql -U sapfs_user -d sapfs_db -c "SELECT COUNT(*) FROM students;"'
res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
print(res.stdout)
