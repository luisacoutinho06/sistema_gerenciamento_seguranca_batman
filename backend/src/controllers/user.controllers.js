// DESCRIÇÃO: Arquivo responsável pelo CRUD da classe: 'User'

const User = require("../models/user.models");

// ==> Async e await

// ==> Método responsável por registrar novo usuário.
exports.registerNewUser = async (req, res) => {
  try {
    let isUser = await User.find({ email: req.body.email });

    if (isUser.length >= 1) {
      return res
        .status(409)
        .json({ message: "Desculpe! Este email já está registrado!" });
    }

    const newUser = new User(req.body);
    newUser.role = "usuarioComum";
    const user = await newUser.save();
    const token = await newUser.generateAuthToken();

    res
      .status(201)
      .json({ message: "Usuário criado com sucesso!", user, token });
  } catch (err) {
    res.status(400).json({
      err: err,
    });
  }
};

// ==> Método responsável por logar o usuário.
exports.loginUser = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const user = await User.findByCredentials(email, password);

    if (!user) {
      return res.status(401).json({
        error: "Erro ao realizar o Login! Verifique suas credenciais.",
      });
    }

    const token = await user.generateAuthToken();

    res
      .status(201)
      .json({ messsage: "Usuário(a) logado(a) com sucesso!", user, token });
  } catch (err) {
    res.status(400).json({
      err: err,
    });
  }
};

exports.returnUserProfile = async (req, res) => {
  try {
    await res.json(req.userData);
  } catch (err) {
    res.status(400).json({
      err: err,
    });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const token = req.header("Authorization").replace('Bearer', '').trim();
    if (!token) {
      return res
        .status(401)
        .json({ error: "Acesso negado! Token não fornecido." });
    }

    const user = await User.findOne({ "tokens.token": token });
    
    if (!user) {
      return res.status(401).json({ error: "Token não encontrado no banco de dados ou inválido!" });
    }

    if (user.role !== "administrador") {
      return res
        .status(403)
        .json({
          error:
            "Acesso negado! Somente administradores podem visualizar todos os usuários.",
        });
    }

    const users = await User.find({});
    res.status(200).json({ users });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Método responsável por editar o nome, email e tipo de usuário
exports.updateUser = async (req, res) => {
  try {
    const token = req.header("Authorization").replace('Bearer', '').trim();
    if (!token) {
      return res
        .status(401)
        .json({ error: "Acesso negado! Token não fornecido." });
    }

    const userId = req.params.id;
    const { name, email, role } = req.body;

    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== userId) {
        return res.status(409).json({ message: "Este email já está em uso!" });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email, role },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "Usuário não encontrado!" });
    }

    res.status(200).json({ message: "Usuário atualizado com sucesso!", updatedUser });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Método responsável por deletar o usuário
exports.deleteUser = async (req, res) => {
  try {
    const token = req.header("Authorization").replace('Bearer', '').trim();
    if (!token) {
      return res
        .status(401)
        .json({ error: "Acesso negado! Token não fornecido." });
    }

    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado!" });
    }

    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: "Usuário deletado com sucesso!" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
