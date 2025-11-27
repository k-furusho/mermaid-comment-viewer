/**
 * mermaid
 * graph TD
 *     A[Start] --> B{Is it working?}
 *     B -- Yes --> C[Great!]
 *     B -- No --> D[Debug]
 *     D --> E[Fix Issue]
 *     E --> B
 *     C --> F[End]
 */
function example() {
  // Your code here
  console.log('Hello, Mermaid!');
}

/**
 * mermaid
 * sequenceDiagram
 *     participant User
 *     participant API
 *     participant Database
 *     User->>API: Request Data
 *     API->>Database: Query
 *     Database-->>API: Results
 *     API-->>User: Response
 */
export async function fetchUserData(userId: string) {
  // Implementation here
  return { id: userId, name: 'John Doe' };
}

/**
 * mermaid
 * flowchart LR
 *     A[Input] --> B[Process]
 *     B --> C[Output]
 *     style A fill:#f9f,stroke:#333,stroke-width:2px
 *     style B fill:#bbf,stroke:#333,stroke-width:2px
 *     style C fill:#bfb,stroke:#333,stroke-width:2px
 */
export function processData(input: unknown): unknown {
  return input;
}

/**
 * 決済トランザクション管理クラス
 * * 外部決済プロバイダー（Stripe等）との整合性を保ちながら、
 * 注文のライフサイクルを管理します。
 * * ## ステート遷移図
 * * @mermaid
 * stateDiagram-v2
 *     [*] --> Created: 注文作成
 *     Created --> Locking: 在庫引当開始
 *     state fork_state <<fork>>
 *     Locking --> fork_state
 *     fork_state --> StockReserved: 引当成功
 *     fork_state --> Failed: 引当失敗
 *     StockReserved --> Authorized: クレジット与信確保
 *     Authorized --> Captured: 売上確定（発送時）
 *     Authorized --> Voided: ユーザーキャンセル/期限切れ
 *     Captured --> Refunded: 返金処理
 *     Failed --> [*]
 *     Voided --> [*]
 *     Refunded --> [*]
 */
export class PaymentTransaction {
  private state: string = 'Created';

  constructor(private readonly orderId: string) {}

  /**
   * 在庫引当を試行し、成功すれば与信枠確保へ進みます
   */
  async processLock(): Promise<void> {
    // ... 具体的な実装
  }
}

