#!/usr/bin/env python3
import sys
import os
from pathlib import Path

def main():
    if len(sys.argv) != 3:
        print(f"Usage: {sys.argv[0]} <img_dir> <index>")
        print(f"Example: {sys.argv[0]} dyaroshev_presentations/img/rcu/load_store_basics 3")
        sys.exit(1)

    directory = Path(sys.argv[1])
    index = int(sys.argv[2])

    extensions = ['.png', '.svg']

    for ext in extensions:
        target = directory / f'img{index}{ext}'
        if target.exists():
            target.unlink()
            print(f'Deleted {target}')

    i = index + 1
    while True:
        moved_any = False
        for ext in extensions:
            src = directory / f'img{i}{ext}'
            dst = directory / f'img{i - 1}{ext}'
            if src.exists():
                src.rename(dst)
                print(f'Renamed {src.name} -> {dst.name}')
                moved_any = True
        if not moved_any:
            break
        i += 1

if __name__ == '__main__':
    main()
