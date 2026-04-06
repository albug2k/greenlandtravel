#!/usr/bin/env python3
"""
Run this locally to fix the migration file before pushing.
It finds the problematic ALTER COLUMN line and adds the USING cast.

Usage: python fix_migration.py
"""
import os, re, glob

# Find the migration file
pattern = "backend/migrations/versions/*.py"
files   = glob.glob(pattern)

if not files:
    print("No migration files found at:", pattern)
    exit(1)

for filepath in files:
    with open(filepath, 'r') as f:
        content = f.read()

    # Fix: ALTER COLUMN payment_details TYPE JSON
    # PostgreSQL needs USING clause to cast TEXT → JSON
    old = "op.alter_column('payment_details',"
    
    # More targeted - find the batch_alter_table for payments with JSON cast
    # Replace the problematic alter_column with postgresql_using
    old_pattern = r"(batch_op\.alter_column\('payment_details',\s*existing_type=.*?sa\.Text\(\).*?,\s*type_=postgresql\.JSON\(\).*?\))"
    
    if 'payment_details' in content and 'JSON' in content:
        print(f"Found issue in: {filepath}")
        
        # Replace the JSON alter_column to include postgresql_using
        new_content = re.sub(
            r"(batch_op\.alter_column\('payment_details',[^)]*type_=postgresql\.JSON\(\)[^)]*\))",
            "batch_op.alter_column('payment_details',\n"
            "               existing_type=sa.Text(),\n"
            "               type_=sa.JSON(),\n"
            "               postgresql_using='payment_details::json',\n"
            "               existing_nullable=True)",
            content,
            flags=re.DOTALL
        )
        
        if new_content != content:
            with open(filepath, 'w') as f:
                f.write(new_content)
            print(f"  ✅ Fixed {filepath}")
        else:
            print(f"  ⚠️  Pattern not matched exactly - showing context:")
            # Show lines around payment_details
            for i, line in enumerate(content.split('\n')):
                if 'payment_details' in line:
                    print(f"    Line {i}: {line}")
    else:
        print(f"No payment_details JSON issue in: {filepath}")

print("\nDone. Commit the fixed migration file and push.")