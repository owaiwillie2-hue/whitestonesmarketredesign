import os

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            if "import { toast } from 'sonner'" in content or 'import { toast } from "sonner"' in content:
                content = content.replace("import { toast } from 'sonner'", "import { toast } from '@/lib/toast'")
                content = content.replace('import { toast } from "sonner"', "import { toast } from '@/lib/toast'")
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Updated {filepath}")
