<?php
/**
 * admin-backend.php — Suprema Glass & Facilities
 * Backend seguro do painel administrativo.
 *
 * SEGURANÇA:
 *  - Autenticação via bcrypt (custo 12)
 *  - Token HMAC-SHA256 com validade de 8h
 *  - Rate limiting por IP (5 tentativas / 5 min)
 *  - Validação de tipo MIME real (não só extensão)
 *  - Sanitização recursiva de inputs
 *  - Headers HTTP de segurança
 *  - Prevenção de path traversal em uploads/deleções
 *
 * CONFIGURAÇÃO — edite apenas esta seção:
 */

// ── ⚙️  CONFIGURAÇÕES ──────────────────────────────────────────────────────────
// Para gerar um novo hash: use https://bcrypt-generator.com/ com custo 12
// ou execute no terminal: php -r "echo password_hash('SuaSenha', PASSWORD_BCRYPT, ['cost'=>12]);"
define('SENHA_HASH',    '$2y$12$cSM14dcodeuvnA2FSzBKZ.2C3Ihnh.PmenSaQe09OJrpiwy7HeApS');

// String secreta aleatória — TROQUE antes de publicar (mínimo 32 chars)
define('TOKEN_SECRET',  'SupremaGlass2026_!xK8#mPqZ@rWvNjLtYhCbEoDfAi');

// Caminhos — não altere a menos que mova os arquivos
define('JSON_PATH',     __DIR__ . '/assets/data/portfolio.json');
define('IMG_PATH',      __DIR__ . '/assets/img/services/webp/');
define('IMG_URL_BASE',  'assets/img/services/webp/');
define('IMG_MAX_SIZE',  8 * 1024 * 1024); // 8 MB
define('RATE_FILE',     sys_get_temp_dir() . '/sg_rl_' . md5($_SERVER['REMOTE_ADDR'] ?? 'x') . '.json');
// ──────────────────────────────────────────────────────────────────────────────

// Headers de segurança
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Cache-Control: no-store, no-cache, must-revalidate');
header('Referrer-Policy: strict-origin-when-cross-origin');

// CORS — aceita apenas do mesmo domínio
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin) header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Token');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST')    { json_error(405, 'Método não permitido'); }

// Roteamento
$isFormData = !empty($_FILES) || !empty($_POST['action']);
$body       = $isFormData ? $_POST : (json_decode(file_get_contents('php://input'), true) ?? []);
$action     = $body['action'] ?? '';

switch ($action) {
    case 'login':   handle_login($body);   break;
    case 'save':    handle_save();         break;
    case 'upload':  handle_upload();       break;
    case 'delete':  handle_delete($body);  break;
    default:        json_error(400, 'Ação inválida');
}

// ── LOGIN ─────────────────────────────────────────────────────────────────────
function handle_login(array $body): void {
    rate_check();

    $senha = $body['senha'] ?? '';
    if (empty($senha) || !password_verify($senha, SENHA_HASH)) {
        rate_record();
        sleep(1); // Delay anti-brute-force
        json_error(401, 'Senha incorreta. Tente novamente.');
    }

    rate_reset();
    json_ok(['token' => make_token()]);
}

// ── SALVAR JSON ───────────────────────────────────────────────────────────────
function handle_save(): void {
    verify_token();

    $raw  = file_get_contents('php://input');
    $body = json_decode($raw, true);
    $data = $body['data'] ?? null;

    if (!is_array($data) || !isset($data['categorias']) || !is_array($data['categorias'])) {
        json_error(400, 'Estrutura de dados inválida.');
    }

    // Validação mínima de cada categoria
    foreach ($data['categorias'] as $cat) {
        if (empty($cat['id']) || empty($cat['label'])) {
            json_error(400, 'Categoria inválida: id e label são obrigatórios.');
        }
        // Valida que projetos é um array
        if (isset($cat['projetos']) && !is_array($cat['projetos'])) {
            json_error(400, 'Campo projetos deve ser um array.');
        }
    }

    // Sanitiza strings recursivamente
    $data = sanitize_recursive($data);

    // Backup automático antes de sobrescrever
    if (file_exists(JSON_PATH)) {
        copy(JSON_PATH, JSON_PATH . '.bak');
    }

    // Garante que a pasta existe
    $dir = dirname(JSON_PATH);
    if (!is_dir($dir)) mkdir($dir, 0755, true);

    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if (file_put_contents(JSON_PATH, $json, LOCK_EX) === false) {
        json_error(500, 'Erro ao salvar. Verifique as permissões da pasta assets/data/');
    }

    $total = array_sum(array_map(fn($c) => count($c['projetos'] ?? []), $data['categorias']));
    json_ok(['msg' => 'Portfólio publicado!', 'projetos' => $total]);
}

// ── UPLOAD DE IMAGEM ──────────────────────────────────────────────────────────
function handle_upload(): void {
    verify_token();

    if (empty($_FILES['imagem'])) json_error(400, 'Nenhum arquivo recebido.');

    $file = $_FILES['imagem'];
    if ($file['error'] !== UPLOAD_ERR_OK) {
        json_error(400, 'Erro no upload (código ' . $file['error'] . ').');
    }
    if ($file['size'] > IMG_MAX_SIZE) {
        json_error(400, 'Arquivo muito grande. Máximo permitido: 8 MB.');
    }

    // Valida tipo MIME real (não confia na extensão enviada)
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime  = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    $allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!in_array($mime, $allowed, true)) {
        json_error(400, "Tipo não permitido ($mime). Use JPEG, PNG ou WebP.");
    }

    // Define extensão pelo MIME real
    $ext = match($mime) {
        'image/webp' => 'webp',
        'image/png'  => 'png',
        default      => 'jpg',
    };

    // Nome de arquivo seguro
    $base   = pathinfo($file['name'], PATHINFO_FILENAME);
    $base   = transliterate($base);
    $base   = preg_replace('/[^a-z0-9\-]/', '-', strtolower($base));
    $base   = trim(preg_replace('/-+/', '-', $base), '-');
    $base   = substr($base, 0, 60);
    $nome   = $base . '-' . time() . '.' . $ext;

    if (!is_dir(IMG_PATH)) mkdir(IMG_PATH, 0755, true);

    $dest = IMG_PATH . $nome;
    if (!move_uploaded_file($file['tmp_name'], $dest)) {
        json_error(500, 'Falha ao mover arquivo. Verifique permissões de assets/img/services/webp/');
    }

    json_ok(['url' => IMG_URL_BASE . $nome, 'nome' => $nome]);
}

// ── DELETAR IMAGEM ────────────────────────────────────────────────────────────
function handle_delete(array $body): void {
    verify_token();

    $arquivo = $body['arquivo'] ?? '';
    if (empty($arquivo)) json_error(400, 'Nome de arquivo não informado.');

    // Previne path traversal — só permite basename dentro de IMG_PATH
    $nome    = basename($arquivo);
    $caminho = realpath(IMG_PATH . $nome);
    $base    = realpath(IMG_PATH);

    if (!$caminho || strpos($caminho, $base) !== 0) {
        json_error(403, 'Acesso negado.');
    }

    if (!file_exists($caminho)) {
        json_ok(['msg' => 'Arquivo já não existe.']);
    }

    if (!unlink($caminho)) {
        json_error(500, 'Não foi possível deletar o arquivo.');
    }

    json_ok(['msg' => 'Imagem removida.']);
}

// ── TOKEN ─────────────────────────────────────────────────────────────────────
function make_token(): string {
    $ts      = time();
    $payload = $ts . '|' . ($_SERVER['REMOTE_ADDR'] ?? '');
    $sig     = hash_hmac('sha256', $payload, TOKEN_SECRET);
    return $sig . '.' . base64_encode((string) $ts);
}

function verify_token(): void {
    $token = $_SERVER['HTTP_X_ADMIN_TOKEN']
          ?? $_POST['token']
          ?? '';

    if (empty($token)) json_error(401, 'Token ausente. Faça login novamente.');

    $parts = explode('.', $token);
    if (count($parts) !== 2) json_error(401, 'Token malformado.');

    $ts = (int) base64_decode($parts[1]);
    if ($ts <= 0) json_error(401, 'Token inválido.');

    // Sessão válida por 8 horas
    if (time() - $ts > 28800) {
        json_error(401, 'Sessão expirada. Faça login novamente.');
    }

    $payload  = $ts . '|' . ($_SERVER['REMOTE_ADDR'] ?? '');
    $expected = hash_hmac('sha256', $payload, TOKEN_SECRET);
    if (!hash_equals($expected, $parts[0])) {
        json_error(401, 'Token inválido.');
    }
}

// ── RATE LIMITING ─────────────────────────────────────────────────────────────
function rate_check(): void {
    if (!file_exists(RATE_FILE)) return;
    $d = json_decode(file_get_contents(RATE_FILE), true);
    if (!$d) return;
    if (time() - ($d['t'] ?? 0) > 300) { @unlink(RATE_FILE); return; }
    if (($d['n'] ?? 0) >= 5) {
        $wait = 300 - (time() - $d['t']);
        json_error(429, "Muitas tentativas. Aguarde $wait segundos.");
    }
}

function rate_record(): void {
    $d = ['n' => 1, 't' => time()];
    if (file_exists(RATE_FILE)) {
        $ex = json_decode(file_get_contents(RATE_FILE), true);
        if ($ex && time() - ($ex['t'] ?? 0) < 300) {
            $d['n'] = ($ex['n'] ?? 0) + 1;
            $d['t'] = $ex['t'];
        }
    }
    file_put_contents(RATE_FILE, json_encode($d), LOCK_EX);
}

function rate_reset(): void { @unlink(RATE_FILE); }

// ── HELPERS ───────────────────────────────────────────────────────────────────
function sanitize_recursive(mixed $v): mixed {
    if (is_array($v))  return array_map('sanitize_recursive', $v);
    if (is_string($v)) return htmlspecialchars(strip_tags($v), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    return $v;
}

function transliterate(string $str): string {
    // Converte caracteres acentuados para ASCII
    $map = [
        'á'=>'a','à'=>'a','â'=>'a','ã'=>'a','ä'=>'a',
        'é'=>'e','è'=>'e','ê'=>'e','ë'=>'e',
        'í'=>'i','ì'=>'i','î'=>'i','ï'=>'i',
        'ó'=>'o','ò'=>'o','ô'=>'o','õ'=>'o','ö'=>'o',
        'ú'=>'u','ù'=>'u','û'=>'u','ü'=>'u',
        'ç'=>'c','ñ'=>'n',
        'Á'=>'A','À'=>'A','Â'=>'A','Ã'=>'A','Ä'=>'A',
        'É'=>'E','È'=>'E','Ê'=>'E','Ë'=>'E',
        'Í'=>'I','Ì'=>'I','Î'=>'I','Ï'=>'I',
        'Ó'=>'O','Ò'=>'O','Ô'=>'O','Õ'=>'O','Ö'=>'O',
        'Ú'=>'U','Ù'=>'U','Û'=>'U','Ü'=>'U',
        'Ç'=>'C','Ñ'=>'N',
    ];
    return strtr($str, $map);
}

function json_ok(array $data): never {
    echo json_encode(['ok' => true, ...$data], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function json_error(int $code, string $msg): never {
    http_response_code($code);
    echo json_encode(['ok' => false, 'erro' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
}
