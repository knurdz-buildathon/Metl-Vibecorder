from __future__ import annotations

import argparse


def main() -> None:
    parser = argparse.ArgumentParser(
        prog="python -m web_test",
        description="Metl Web Test Lab commands",
    )
    parser.add_argument(
        "command",
        nargs="?",
        choices=["doctor", "smoke", "agent"],
        help="Run `python -m web_test.<command>` for command-specific options.",
    )
    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    print(f"Run: python -m web_test.{args.command} --help")


if __name__ == "__main__":
    main()
