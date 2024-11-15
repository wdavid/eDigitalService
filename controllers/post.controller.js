const Post = require('../models/post.model');
const controller = {};
const Mongoose = require('mongoose');
const debug = require('debug')('app:post-controller');
const User = require('../models/user.model');

// Crear un nuevo registro de consumo
controller.create = async (req, res, next) => {
    try {
        const { userId, volumen, vasos } = req.body;
        const { user } = req;

        // Validar que los datos necesarios estén presentes
        if (!userId || !volumen || !vasos) {
            return res.status(400).json({ error: "Datos incompletos" });
        }

        // Crear el registro
        const post = new Post({
            userId,
            volumen,
            vasos,
        });

        const postSave = await post.save();
        if (!postSave) {
            return res.status(400).json({ error: "Error creating post" });
        }

        return res.status(201).json(postSave);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

// Obtener todos los registros de consumo
controller.findAll = async (req, res, next) => {
    try {
        // Buscar registros con información del usuario
        const posts = await Post.find().populate('userId', 'username email');
        if (!posts || posts.length === 0) {
            return res.status(404).json({ error: "Posts not found" });
        }

        return res.status(200).json(posts);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

// Obtener un registro de consumo por ID
controller.findOneById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const post = await Post.findById(id).populate('userId', 'username email');
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        return res.status(200).json(post);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

// Eliminar un registro de consumo por ID
controller.deleteById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const post = await Post.findByIdAndDelete(id);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }
        return res.status(200).json({ message: "Post deleted" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

controller.getDailyConsumption = async (req, res, next) => {
    try {
        const { userId } = req.params;

        // Validar que el userId sea un ObjectId válido
        if (!Mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: "Invalid userId" });
        }

        const dailyConsumption = await Post.aggregate([
            {
                $match: {
                    userId: new Mongoose.Types.ObjectId(userId) // Filtrar por usuario
                }
            },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        userId: "$userId" // Incluir userId en el grupo
                    },
                    totalVolumen: { $sum: "$volumen" },
                    totalVasos: { $sum: "$vasos" }
                }
            },
            {
                $sort: { "_id.date": 1 } // Ordenar por fecha
            }
        ]);

        // Obtener datos del usuario
        const user = await User.findById(userId).select("username email metaconsumo");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Combinar la información del usuario con el consumo diario
        const response = dailyConsumption.map((entry) => ({
            ...entry,
            user,
        }));

        return res.status(200).json(response);
    } catch (error) {
        console.error("Error en getDailyConsumption:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};


controller.getWeeklyConsumption = async (req, res, next) => {
    try {
        const { userId } = req.params;

        if (!Mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: "Invalid userId" });
        }

        const weeklyConsumption = await Post.aggregate([
            {
                $match: {
                    userId: new Mongoose.Types.ObjectId(userId) // Filtrar por usuario
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" }, // Año
                        week: { $isoWeek: "$createdAt" } // Semana ISO
                    },
                    totalVolumen: { $sum: "$volumen" },
                    totalVasos: { $sum: "$vasos" }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.week": 1 } // Ordenar por año y semana
            }
        ]);

        // Obtener datos del usuario
        const user = await User.findById(userId).select("username email metaconsumo");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Combinar datos del usuario con el consumo semanal
        const response = weeklyConsumption.map((entry) => ({
            ...entry,
            user,
        }));

        return res.status(200).json(response);
    } catch (error) {
        console.error("Error en getWeeklyConsumption:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};


controller.getMonthlyConsumption = async (req, res, next) => {
    try {
        const { userId } = req.params;

        if (!Mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: "Invalid userId" });
        }

        const monthlyConsumption = await Post.aggregate([
            {
                $match: {
                    userId: new Mongoose.Types.ObjectId(userId) // Filtrar por usuario
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" }, // Año
                        month: { $month: "$createdAt" } // Mes
                    },
                    totalVolumen: { $sum: "$volumen" },
                    totalVasos: { $sum: "$vasos" }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 } // Ordenar por año y mes
            }
        ]);

        // Obtener datos del usuario
        const user = await User.findById(userId).select("username email metaconsumo");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Combinar datos del usuario con el consumo mensual
        const response = monthlyConsumption.map((entry) => ({
            ...entry,
            user,
        }));

        return res.status(200).json(response);
    } catch (error) {
        console.error("Error en getMonthlyConsumption:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};


module.exports = controller;
