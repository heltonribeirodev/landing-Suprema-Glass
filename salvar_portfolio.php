<?php
header('Content-Type: application/json');

// Ajuste o caminho caso a pasta assets esteja em outro nível de diretório
$arquivo = '../assets/data/portfolio.json'; 

$dados = file_get_contents("php://input");

if ($dados) {
    if (file_put_contents($arquivo, $dados) !== false) {
        echo json_encode(["status" => "sucesso"]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "erro", "mensagem" => "Falha de permissão ao gravar."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "erro", "mensagem" => "Sem dados."]);
}
?>