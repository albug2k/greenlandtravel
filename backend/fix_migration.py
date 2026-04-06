#!/usr/bin/env python3
"""
Fix the payment_details TEXT->JSON cast issue in Alembic migration files.

Run from ANYWHERE — it auto-detects the migration file.
Usage: python fix_migration.py
"""
import os
import re
import glob

# ── Find migration files — search from script location upward ─────────────────
script_dir = os.path.dirname(os.path.abspath(__file__))

search_patterns = [
    # If run from project root
    os.path.join(script_dir, "backend", "migrations", "versions", "*.py"),
    # If run from backend/
    os.path.join(script_dir, "migrations", "versions", "*.py"),
    # If run from backend/migrations/
    os.path.join(script_dir, "versions", "*.py"),
    # Absolute fallback — search entire subtree
    os.path.join(script_dir, "**", "migrations", "versions", "*.py"),
]

files = []
for pattern in search_patterns:
    found = glob.glob(pattern, recursive=True)
    if found:
        files.extend(found)
        break

if not files:
    print("❌  Could not find any migration files.")
    print("    Searched in:")
    for p in search_patterns:
        print(f"      {p}")
    print("\n    Please open the migration file manually and apply the fix below.")
    print("\n    Find this in your migration file (inside a batch_alter_table('payments') block):")
    print("      batch_op.alter_column('payment_details', ... type_=... JSON() ...)")
    print("\n    Replace it with:")
    print("      batch_op.alter_column('payment_details',")
    print("          existing_type=sa.Text(),")
    print("          type_=sa.JSON(),")
    print("          postgresql_using='payment_details::json',")
    print("          existing_nullable=True)")
    exit(1)

print(f"✅  Found {len(files)} migration file(s):")
for f in files:
    print(f"    {f}")

fixed_any = False

for filepath in files:
    with open(filepath, 'r') as f:
        content = f.read()

    if 'payment_details' not in content:
        print(f"\n  ℹ️  No payment_details column in {os.path.basename(filepath)} — skipping")
        continue

    print(f"\n  📄  Processing: {filepath}")

    # Show all lines mentioning payment_details so user can see context
    lines = content.split('\n')
    print("  Lines referencing payment_details:")
    for i, line in enumerate(lines, 1):
        if 'payment_details' in line.lower():
            print(f"    Line {i:3d}: {line}")

    # ── Strategy: replace the whole alter_column block for payment_details ────
    # Handles variations in whitespace and argument order
    new_content = re.sub(
        r"batch_op\.alter_column\(\s*'payment_details'.*?\)",
        (
            "batch_op.alter_column('payment_details',\n"
            "               existing_type=sa.Text(),\n"
            "               type_=sa.JSON(),\n"
            "               postgresql_using='payment_details::json',\n"
            "               existing_nullable=True)"
        ),
        content,
        flags=re.DOTALL
    )

    # Also handle op.alter_column (without batch)
    new_content = re.sub(
        r"op\.alter_column\(\s*'payments'\s*,\s*'payment_details'.*?\)",
        (
            "op.alter_column('payments', 'payment_details',\n"
            "               existing_type=sa.Text(),\n"
            "               type_=sa.JSON(),\n"
            "               postgresql_using='payment_details::json',\n"
            "               existing_nullable=True)"
        ),
        new_content,
        flags=re.DOTALL
    )

    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"  ✅  Fixed! Saved to {filepath}")
        fixed_any = True
    else:
        print(f"  ⚠️  Pattern not matched automatically.")
        print(f"      Open the file and manually add:")
        print(f"      postgresql_using='payment_details::json'")
        print(f"      to the alter_column call for payment_details")

if fixed_any:
    print("\n✅  Done! Now commit and push:")
    print("    git add backend/migrations/")
    print("    git commit -m \"Fix: payment_details TEXT->JSON cast for PostgreSQL\"")
    print("    git push")
else:
    print("\n  No changes were needed or the fix couldn't be applied automatically.")
    print("  The build.sh using db.create_all() will bypass this issue anyway.")