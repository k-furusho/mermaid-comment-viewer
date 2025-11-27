"""
mermaid
sequenceDiagram
    Alice->>Bob: Hello
    Bob->>Alice: Hi there!
    Alice->>Bob: How are you?
    Bob-->>Alice: I'm doing great!
"""

def greet():
    """Simple greeting function"""
    pass


"""
mermaid
graph LR
    A[Client] --> B[API Server]
    B --> C[Database]
    B --> D[Cache]
    D --> C
    style A fill:#e1f5
    style B fill:#fff4e6
    style C fill:#f3e5f5
    style D fill:#e8f5e9
"""

def process_request():
    """Process API request"""
    pass


"""
mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Processing: Start
    Processing --> Complete: Success
    Processing --> Error: Failure
    Error --> Idle: Retry
    Complete --> [*]
"""

class StateMachine:
    """State machine implementation"""
    pass

