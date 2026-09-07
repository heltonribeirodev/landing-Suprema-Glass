<?php
header('Content-Type: application/json');

// Caminho relativo assumindo que o salvar_portfolio.php está na mesma pasta que o admin.html
$arquivo = 'assets/data/portfolio.json'; 

$dados = file_get_contents("php://input");

if ($dados) {
    if (file_put_contents($arquivo, $dados) !== false) {
        echo json_encode(["status" => "sucesso", "mensagem" => "Arquivo atualizado com sucesso!"]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "erro", "mensagem" => "Falha de permissão ao gravar no servidor."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "erro", "mensagem" => "Nenhum dado recebido."]);
}
?>