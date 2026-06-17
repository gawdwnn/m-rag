import os
import signal
import time


def main() -> None:
    worker_id = os.getenv("M_RAGFLOW_WORKER_ID", "worker-0")
    running = True

    def stop(_signum, _frame) -> None:
        nonlocal running
        running = False

    signal.signal(signal.SIGINT, stop)
    signal.signal(signal.SIGTERM, stop)

    print(
        f"task_executor boundary {worker_id} booted; queues start in the ingestion slice.",
        flush=True,
    )
    while running:
        time.sleep(1)

    print(f"task_executor boundary {worker_id} stopped.", flush=True)


if __name__ == "__main__":
    main()
