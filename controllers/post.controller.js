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

        // Obtener la fecha de inicio y fin del día actual
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const dailyConsumption = await Post.aggregate([
            {
                $match: {
                    userId: new Mongoose.Types.ObjectId(userId), // Filtrar por usuario
                    createdAt: { $gte: startOfDay, $lte: endOfDay }, // Filtrar por el día de hoy
                },
            },
            {
                $group: {
                    _id: null, // No agrupar por fecha, ya que es solo para hoy
                    totalVolumen: { $sum: "$volumen" },
                    totalVasos: { $sum: "$vasos" },
                },
            },
        ]);

        // Obtener datos del usuario
        const user = await User.findById(userId).select("username email metaconsumo");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Construir la respuesta
        const response = {
            date: startOfDay.toISOString().split("T")[0], // Formato YYYY-MM-DD
            totalVolumen: dailyConsumption[0]?.totalVolumen || 0,
            totalVasos: dailyConsumption[0]?.totalVasos || 0,
            user,
        };

        return res.status(200).json(response);
    } catch (error) {
        console.error("Error en getDailyConsumption:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

controller.getWeeklyConsumption = async (req, res, next) => {
    try {
        const { userId } = req.params;

        // Validar que el userId sea un ObjectId válido
        if (!Mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: "Invalid userId" });
        }

        // Calcular inicio y fin de la semana
        const today = new Date();
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1)); // Lunes
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 7)); // Domingo
        endOfWeek.setHours(23, 59, 59, 999);

        const weeklyConsumption = await Post.aggregate([
            {
                $match: {
                    userId: new Mongoose.Types.ObjectId(userId), // Filtrar por usuario
                    createdAt: { $gte: startOfWeek, $lte: endOfWeek }, // Filtrar por semana actual
                },
            },
            {
                $group: {
                    _id: { day: { $dayOfWeek: "$createdAt" } }, // Agrupar por día de la semana
                    totalVolumen: { $sum: "$volumen" },
                    totalVasos: { $sum: "$vasos" },
                },
            },
            {
                $sort: { "_id.day": 1 }, // Ordenar por día de la semana
            },
        ]);

        // Obtener datos del usuario
        const user = await User.findById(userId).select("username email metaconsumo");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Construir la respuesta
        const response = {
            startOfWeek: startOfWeek.toISOString().split("T")[0], // Inicio de la semana (YYYY-MM-DD)
            endOfWeek: endOfWeek.toISOString().split("T")[0],     // Fin de la semana (YYYY-MM-DD)
            weeklyConsumption: weeklyConsumption.map((entry) => ({
                dayOfWeek: entry._id.day, // Día de la semana (1 = Domingo, 2 = Lunes, etc.)
                totalVolumen: entry.totalVolumen,
                totalVasos: entry.totalVasos,
            })),
            user,
        };

        return res.status(200).json(response);
    } catch (error) {
        console.error("Error en getWeeklyConsumption:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};


controller.getMonthlyConsumption = async (req, res, next) => {
    try {
        const { userId } = req.params;

        // Validar que el userId sea un ObjectId válido
        if (!Mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: "Invalid userId" });
        }

        // Calcular el inicio y fin del mes actual
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1); // Primer día del mes
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Último día del mes
        endOfMonth.setHours(23, 59, 59, 999);

        const monthlyConsumption = await Post.aggregate([
            {
                $match: {
                    userId: new Mongoose.Types.ObjectId(userId), // Filtrar por usuario
                    createdAt: { $gte: startOfMonth, $lte: endOfMonth }, // Filtrar por mes actual
                },
            },
            {
                $group: {
                    _id: { day: { $dayOfMonth: "$createdAt" } }, // Agrupar por día del mes
                    totalVolumen: { $sum: "$volumen" },
                    totalVasos: { $sum: "$vasos" },
                },
            },
            {
                $sort: { "_id.day": 1 }, // Ordenar por día del mes
            },
        ]);

        // Obtener datos del usuario
        const user = await User.findById(userId).select("username email metaconsumo");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Construir la respuesta
        const response = {
            startOfMonth: startOfMonth.toISOString().split("T")[0], // Inicio del mes (YYYY-MM-DD)
            endOfMonth: endOfMonth.toISOString().split("T")[0],     // Fin del mes (YYYY-MM-DD)
            monthlyConsumption: monthlyConsumption.map((entry) => ({
                day: entry._id.day, // Día del mes
                totalVolumen: entry.totalVolumen,
                totalVasos: entry.totalVasos,
            })),
            user,
        };

        return res.status(200).json(response);
    } catch (error) {
        console.error("Error en getMonthlyConsumption:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};


module.exports = controller;
